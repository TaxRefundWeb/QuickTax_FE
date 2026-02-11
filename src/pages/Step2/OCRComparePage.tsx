import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

import OCRresult, { type OcrSection } from "../../components/card/OCRresult";
import { getCaseOcr, type OcrStatus, type OcrYearData } from "../../lib/api/ocr";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PeriodState = {
  startYear?: string;
  endYear?: string;
  customerId?: number | string;
  caseId?: number | string;
};

type YearForm = {
  workplaces: any[];
  reduceStart: string | null;
  reduceEnd: string | null;
  docDate: string;
  spouse: string | null;
  spouseName: string;
  spouseRrn: string;
  child: string | null;
  children: any[];
};

type OcrNavState = {
  period?: PeriodState;
  years?: string[];
  formsByYear?: Record<string, YearForm>;
};

// Swagger 기준 + UI에 없던 항목 추가 + field로 연결
const OCR_SECTIONS: OcrSection[] = [
  {
    title: "1. 소득명세",
    rows: [
      { label: "총급여", badge: "16", field: "totalSalary" },
      { label: "근무처 1 합계", badge: "21", field: "companies[0].salary" },
      { label: "근무처 2 합계", badge: "21", field: "companies[1].salary" },
    ],
  },
  {
    title: "2. 소득공제",
    rows: [
      { label: "근로소득공제", badge: "22", field: "earnedIncomeDeductionAmount" },
      { label: "근로소득금액", badge: "23", field: "earnedIncomeAmount" },
      { label: "기본공제 본인", badge: "24", field: "basicDeductionSelfAmount" },
      { label: "기본공제 배우자", badge: "25", field: "basicDeductionSpouseAmount" },
      { label: "기본공제 부양가족", badge: "26", field: "basicDeductionDependentsAmount" },
      { label: "국민연금보험료 공제금액", badge: "31-2", field: "nationalPensionDeductionAmount" },
      { label: "특별소득공제 합계", badge: "36", field: "totalSpecialIncomeDeductionTotalAmount" },
      { label: "차감소득금액", badge: "37", field: "adjustedIncomeAmount" },
      { label: "그 외 소득공제 계", badge: "47", field: "otherIncomeDeductionTotalAmount" },
      { label: "그 외 소득공제 추가", badge: "-", field: "otherIncomeDeductionExtra" }, // ✅ 추가
    ],
  },
  {
    title: "3. 과세표준 및 산출세액 / 감면",
    rows: [
      { label: "종합소득 과세표준", badge: "49", field: "taxBaseAmount" },
      { label: "산출세액", badge: "50", field: "calculatedTaxAmount" },
      { label: "세액감면 합계", badge: "55", field: "taxReductionTotalAmount" },
    ],
  },
  {
    title: "4. 세액공제",
    rows: [
      { label: "근로소득", badge: "56", field: "earnedIncomeTotalAmount" }, // ⚠️ 의미 확정되면 라벨 수정 추천
      { label: "자녀 공제대상자녀", badge: "57-1", field: "eligibleChildrenCount" },
      { label: "자녀 출산/입양자", badge: "57-2", field: "childbirthAdoptionCount" },
      { label: "월세액 세액 공제금액", badge: "70-2", field: "monthlyRentTaxCreditAmount" },
      { label: "기부금 합계", badge: "-", field: "donationTotalAmount" }, // 추가
      { label: "표준세액공제", badge: "-", field: "standardTaxCredit" }, // 추가
      { label: "세액공제 계", badge: "71", field: "totalTaxCreditAmount" },
      { label: "결정세액", badge: "72", field: "determinedTaxAmountOrigin" },
    ],
  },
];

export default function OcrComparePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // URL에서 caseId 받기 (라우트: /:caseId/step2/ocr-compare)
  const { caseId: caseIdParam } = useParams<{ caseId: string }>();
  const caseId = (() => {
    if (!caseIdParam) return null;
    const n = Number(String(caseIdParam).trim());
    return Number.isFinite(n) ? n : null;
  })();

  const navState = (location.state as OcrNavState | null) ?? null;

  const startYear = navState?.period?.startYear ?? sessionStorage.getItem("startYear") ?? "";
  const endYear = navState?.period?.endYear ?? sessionStorage.getItem("endYear") ?? "";

  const rawCustomerId = navState?.period?.customerId ?? sessionStorage.getItem("customerId") ?? null;
  const customerId = rawCustomerId === null || rawCustomerId === undefined ? null : Number(rawCustomerId);

  const yearsFromPrev =
    navState?.years ??
    (() => {
      const saved = sessionStorage.getItem("years");
      if (!saved) return [];
      try {
        const arr = JSON.parse(saved);
        return Array.isArray(arr) ? (arr as string[]) : [];
      } catch {
        return [];
      }
    })();

  const _formsByYear =
    navState?.formsByYear ??
    (() => {
      const saved = sessionStorage.getItem("formsByYear");
      if (!saved) return {};
      try {
        const obj = JSON.parse(saved);
        return obj && typeof obj === "object" ? (obj as Record<string, YearForm>) : {};
      } catch {
        return {};
      }
    })();

  useEffect(() => {
    if (startYear) sessionStorage.setItem("startYear", startYear);
    if (endYear) sessionStorage.setItem("endYear", endYear);
    if (Number.isFinite(customerId)) sessionStorage.setItem("customerId", String(customerId));
    if (Number.isFinite(caseId)) sessionStorage.setItem("caseId", String(caseId));
    if (yearsFromPrev.length > 0) sessionStorage.setItem("years", JSON.stringify(yearsFromPrev));
    if (Object.keys(_formsByYear).length > 0) sessionStorage.setItem("formsByYear", JSON.stringify(_formsByYear));
  }, [startYear, endYear, customerId, caseId, yearsFromPrev, _formsByYear]);

  // 필수값 검증 + 리다이렉트
  useEffect(() => {
    if (!Number.isFinite(caseId)) {
      alert("케이스 ID가 없습니다. 다시 진행해주세요.");
      navigate("/", { replace: true });
      return;
    }

    if (!startYear || !endYear || yearsFromPrev.length === 0) {
      if (Number.isFinite(customerId)) {
        navigate(`/${customerId}/step1/period`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [caseId, startYear, endYear, yearsFromPrev.length, customerId, navigate]);

  const [openYears, setOpenYears] = useState<number[]>([]);
  const [activeYear, setActiveYear] = useState<string>("");

  useEffect(() => {
    const parsed = yearsFromPrev.map(Number).filter((n) => !Number.isNaN(n));
    if (parsed.length === 0) return;
    setOpenYears(parsed);
    setActiveYear(String(parsed[0]));
  }, [yearsFromPrev]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const selectedFileName = useMemo(() => file?.name ?? "", [file]);

  // OCR 로딩/상태/데이터
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrByYear, setOcrByYear] = useState<Record<string, OcrYearData>>({});

  // PDF 로딩/에러
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handlePickFile = (picked: File) => {
    const isPdf = picked.name.toLowerCase().endsWith(".pdf") || picked.type === "application/pdf";
    if (!isPdf) {
      alert("PDF 파일만 업로드할 수 있어요!");
      return;
    }

    setPdfError(null);
    setIsPdfLoading(true);
    setFile(picked);

    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(picked);
    });
  };

  // OCR GET 함수 (null 방어 포함)
  const fetchOcr = async () => {
    if (!Number.isFinite(caseId)) return;

    try {
      setIsOcrLoading(true);
      setOcrError(null);

      const res = await getCaseOcr(caseId!);

      setOcrStatus(res.result.status);

      if (res.result.status === "FAILED") {
        setOcrError(res.result.errorMessage ?? "OCR 처리 중 오류가 발생했어요.");
        setOcrByYear({});
        return;
      }

      const list = res.result.data ?? []; // ✅ data null 방어
      const map: Record<string, OcrYearData> = {};
      for (const item of list) {
        map[String(item.caseYear)] = item;
      }
      setOcrByYear(map);
    } catch (e) {
      console.error(e);
      setOcrError("OCR 결과를 불러오지 못했어요.");
      setOcrByYear({});
    } finally {
      setIsOcrLoading(false);
    }
  };

  // 최초 1회 GET
  useEffect(() => {
    void fetchOcr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // 폴링: WAITING_UPLOAD / PROCESSING이면 3초마다 다시 GET
  useEffect(() => {
    if (!Number.isFinite(caseId)) return;
    if (ocrStatus !== "WAITING_UPLOAD" && ocrStatus !== "PROCESSING") return;

    const id = window.setInterval(() => {
      void fetchOcr();
    }, 3000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, ocrStatus]);

  // activeYear에 해당하는 OCR 데이터
  const currentOcr = useMemo(() => {
    if (!activeYear) return null;
    return ocrByYear[activeYear] ?? null;
  }, [activeYear, ocrByYear]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    setPageNumber(1);
    setScale(1);
  }, [activeYear]);

  const currentPdfUrl = pdfUrl;

  const handleGoToStep3 = () => {
    if (!file) {
      alert("먼저 PDF를 업로드해 주세요!");
      return;
    }
    if (!Number.isFinite(caseId)) {
      alert("케이스 ID가 없습니다. 다시 진행해주세요.");
      navigate("/", { replace: true });
      return;
    }

    navigate(`/step3/compare/${caseId}`, {
      state: { year: activeYear },
    });
  };

  useEffect(() => {
    if (!activeYear) return;
    void _formsByYear;
  }, [activeYear, _formsByYear]);

  return (
    <div className="w-full flex justify-center">
      <div className="w-[1400px]">
        {/* 상단 */}
        <div>
          <div className="grid grid-cols-[260px_1fr] gap-6">
            {/* 현재 파일 */}
            <div className="rounded-[12px] border border-gray-200 bg-white p-4">
              <p className="mb-3 text-[12px] font-medium text-gray-700">현재 보고있는 파일</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  handlePickFile(f);
                  e.currentTarget.value = "";
                }}
              />

              <div
                className={[
                  "w-full rounded-[10px] border p-3 text-left transition",
                  isDragging ? "border-[#64A5FF] bg-[#F3F8FF]" : "border-gray-200 bg-[#FAFAFA] hover:bg-gray-50",
                ].join(" ")}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDragging) setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);

                  const f = e.dataTransfer.files?.[0];
                  if (!f) return;
                  handlePickFile(f);
                }}
              >
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full text-left">
                  {selectedFileName ? (
                    <>
                      <div className="text-[13px] text-gray-700">{selectedFileName}</div>
                      <div className="mt-1 text-[12px] text-gray-400">클릭해서 파일 변경</div>
                    </>
                  ) : (
                    <>
                      <div className="text-[13px] text-gray-700">파일 불러오기</div>
                      <div className="mt-1 text-[12px] text-gray-400">
                        클릭해서 파일 선택 또는 <br />
                        드래그해서 놓기
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 연도 탭 */}
            <div className="rounded-[8px] border border-gray-200 bg-white p-4">
              <p className="mb-3 text-[12px] text-gray-700">년도별 인식 결과</p>
              <YearTabs years={openYears} activeKey={activeYear} onChange={setActiveYear} />
            </div>
          </div>
        </div>

        {/* 중단 */}
        <div className="mt-6 w-full rounded-[12px] border border-gray-200 bg-white">
          <div className="h-[800px] grid grid-cols-2">
            {/* 좌측 PDF */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <div className="ml-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPdfLoading || !currentPdfUrl}
                      onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
                      className={[
                        "h-8 rounded-full border border-gray-200 bg-white px-3 text-[12px] text-gray-600 hover:bg-gray-50",
                        (isPdfLoading || !currentPdfUrl) && "opacity-50 cursor-not-allowed hover:bg-white",
                      ].join(" ")}
                      aria-label="축소"
                    >
                      −
                    </button>

                    <div className="min-w-[52px] text-center text-[12px] text-gray-500">{Math.round(scale * 100)}%</div>

                    <button
                      type="button"
                      disabled={isPdfLoading || !currentPdfUrl}
                      onClick={() => setScale((s) => Math.min(2.0, +(s + 0.1).toFixed(2)))}
                      className={[
                        "h-8 rounded-full border border-gray-200 bg-white px-3 text-[12px] text-gray-600 hover:bg-gray-50",
                        (isPdfLoading || !currentPdfUrl) && "opacity-50 cursor-not-allowed hover:bg-white",
                      ].join(" ")}
                      aria-label="확대"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* PDF 영역 */}
              <div className="h-[calc(760px-24px-32px)] overflow-hidden rounded-[10px] border border-gray-200 bg-white">
                {!currentPdfUrl ? (
                  <div className="h-full p-4">
                    <div className="flex h-full items-center justify-center rounded-[10px] border-2 border-dashed border-gray-200 bg-white text-[13px] text-gray-400">
                      <div className="text-center">
                        <div className="text-[30px] text-gray-600">PDF를 불러와 주세요.</div>
                        <div className="mt-1 text-[20px] text-gray-400">
                          왼쪽 상단에서 파일을 선택하거나 드래그해서 놓아주세요
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full p-4 relative">
                    {isPdfLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                        <div className="text-center flex flex-col items-center">
                          <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#64A5FF]" />
                          <div className="text-[14px] text-gray-600">PDF 불러오는 중…</div>
                          <div className="mt-1 text-[12px] text-gray-400">잠시만 기다려 주세요</div>
                        </div>
                      </div>
                    )}

                    {pdfError ? (
                      <div className="py-10 text-center text-[13px] text-red-500">
                        {pdfError}
                        <div className="mt-2 text-[12px] text-gray-500">콘솔(F12) 에러 메시지를 확인해 주세요.</div>
                      </div>
                    ) : (
                      <Document
                        file={currentPdfUrl}
                        onLoadSuccess={(info) => {
                          setNumPages(info.numPages);
                          setPageNumber(1);
                          setIsPdfLoading(false);
                        }}
                        onLoadError={(err) => {
                          console.error("PDF onLoadError:", err);
                          setPdfError("PDF를 불러오지 못했어요.");
                          setIsPdfLoading(false);
                        }}
                        onSourceError={(err) => {
                          console.error("PDF onSourceError:", err);
                          setPdfError("PDF 소스를 불러오지 못했어요.");
                          setIsPdfLoading(false);
                        }}
                        loading={<div className="py-10 text-center text-[13px] text-gray-400">PDF 불러오는 중...</div>}
                        error={
                          <div className="py-10 text-center text-[13px] text-red-500">
                            PDF를 불러오지 못했어요.
                            <div className="mt-2 text-[12px] text-gray-500">콘솔(F12) 에러 메시지를 확인해 주세요.</div>
                          </div>
                        }
                      >
                        <div className="mb-3 flex items-center justify-between text-[12px] text-gray-500">
                          <span>
                            {pageNumber} / {numPages || "-"}
                          </span>
                          <span className="text-gray-400">(선택 연도: {activeYear || "-"})</span>
                        </div>

                        <div className="grid h-[calc(100%-72px)] grid-cols-[92px_1fr] gap-4">
                          <div className="h-full overflow-auto pr-1">
                            <div className="space-y-2">
                              {Array.from({ length: numPages || 0 }, (_, i) => {
                                const p = i + 1;
                                const active = p === pageNumber;

                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    disabled={isPdfLoading}
                                    onClick={() => setPageNumber(p)}
                                    className={[
                                      "w-full rounded-[6px] border bg-white p-1 text-left transition",
                                      active ? "border-[#64A5FF] ring-2 ring-[#64A5FF]/20" : "border-gray-200 hover:bg-gray-50",
                                      isPdfLoading && "opacity-50 cursor-not-allowed hover:bg-white",
                                    ].join(" ")}
                                    aria-label={`${p}페이지로 이동`}
                                  >
                                    <div className="overflow-hidden rounded-[4px]">
                                      <Page pageNumber={p} scale={0.12} renderTextLayer={false} renderAnnotationLayer={false} />
                                    </div>
                                    <div className="mt-1 text-center text-[11px] text-gray-500">{p}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="h-[558px] overflow-auto border border-gray-200 bg-white">
                            <div className="flex justify-center p-4">
                              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
                            </div>
                          </div>
                        </div>
                      </Document>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 우측 OCR 결과 */}
            <div className="h-full bg-white flex flex-col items-center">
              <div className="w-[600px]">
                <div className="pt-6 pl-[40px]">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-[18px] text-gray-800">OCR 인식 결과</p>
                    <span className="text-[12px] text-gray-400">ⓘ</span>
                  </div>
                  <p className="mb-4 text-[14px] text-gray-500">좌측의 원본 서류와 비교하여 수정해주세요</p>
                </div>
              </div>

              {isOcrLoading || ocrStatus === "PROCESSING" ? (
                <div className="flex-1 w-[600px] mx-auto max-h-[600px] rounded-[8px] overflow-hidden">
                  <div className="h-full flex items-center justify-center bg-[#F3F8FF] px-6 py-5">
                    <div className="text-center flex flex-col items-center">
                      <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#64A5FF]" />
                      <div className="text-[14px] text-gray-600">OCR 결과를 분석 중입니다…</div>
                      <div className="mt-1 text-[12px] text-gray-400">잠시만 기다려 주세요</div>
                    </div>
                  </div>
                </div>
              ) : ocrStatus === "WAITING_UPLOAD" ? (
                <div className="flex-1 w-[600px] mx-auto max-h-[600px] rounded-[8px] overflow-hidden">
                  <div className="h-full flex items-center justify-center bg-[#F3F8FF] px-6 py-5">
                    <div className="text-center">
                      <div className="text-[14px] text-gray-600">아직 OCR 결과가 없어요.</div>
                      <div className="mt-1 text-[12px] text-gray-400">
                        PDF 업로드 후 서버 처리 완료되면 결과가 표시돼요.
                      </div>
                    </div>
                  </div>
                </div>
              ) : ocrStatus === "FAILED" || ocrError ? (
                <div className="flex-1 w-[600px] mx-auto max-h-[600px] rounded-[8px] overflow-hidden">
                  <div className="h-full flex items-center justify-center bg-[#F3F8FF] px-6 py-5">
                    <div className="text-center">
                      <div className="text-[14px] text-red-500">{ocrError ?? "OCR 결과를 불러오지 못했어요."}</div>
                      <div className="mt-1 text-[12px] text-gray-400">(status: {ocrStatus ?? "-"})</div>
                    </div>
                  </div>
                </div>
              ) : (
                <OCRresult sections={OCR_SECTIONS} data={currentOcr} />
              )}

              {/* 하단 버튼 */}
              <div className="w-[600px] mt-6 flex justify-end px-0 py-2">
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="h-[40px] w-[120px] rounded-[6px] border border-gray-200 bg-white text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    수정하기
                  </button>

                  <button
                    type="button"
                    onClick={handleGoToStep3}
                    className="h-[40px] w-[120px] rounded-[6px] bg-[#64A5FF] text-[13px] font-medium text-white hover:bg-[#4F93FF]"
                  >
                    계산하기
                  </button>
                </div>
              </div>
            </div>
            {/* /우측 */}
          </div>
        </div>
      </div>
    </div>
  );
}

function YearTabs({
  years,
  activeKey,
  onChange,
}: {
  years: number[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {years.map((y) => {
          const key = String(y);
          const active = key === activeKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={[
                "h-[48px] w-[134px] flex items-center justify-center rounded-[10px] border text-[14px] transition-colors whitespace-nowrap",
                active ? "border-[#64A5FF] bg-[#64A5FF] text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {`${String(y).slice(2)}년`}
            </button>
          );
        })}
      </div>
    </div>
  );
}