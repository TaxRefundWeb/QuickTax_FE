import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

import type { OcrSection } from "../../components/card/OCRresult";
import OcrComparePanel from "./components/OcrComparePanel";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PeriodState = {
  startYear?: string;
  endYear?: string;
  customerId?: number | string;
  caseId?: number | string;
};

type YearForm = {
  workplaces: unknown[];
  reduceStart: string | null;
  reduceEnd: string | null;
  docDate: string;
  spouse: string | null;
  spouseName: string;
  spouseRrn: string;
  child: string | null;
  children: unknown[];
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
      { label: "그 외 소득공제 추가", badge: "-", field: "otherIncomeDeductionExtra" },
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
      { label: "근로소득", badge: "56", field: "earnedIncomeTotalAmount" },
      { label: "자녀 공제대상자녀", badge: "57-1", field: "eligibleChildrenCount" },
      { label: "자녀 출산/입양자", badge: "57-2", field: "childbirthAdoptionCount" },
      { label: "월세액 세액 공제금액", badge: "70-2", field: "monthlyRentTaxCreditAmount" },
      { label: "기부금 합계", badge: "-", field: "donationTotalAmount" },
      { label: "표준세액공제", badge: "-", field: "standardTaxCredit" },
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

  const startYear =
    navState?.period?.startYear ?? sessionStorage.getItem("startYear") ?? "";
  const endYear =
    navState?.period?.endYear ?? sessionStorage.getItem("endYear") ?? "";

  const rawCustomerId =
    navState?.period?.customerId ?? sessionStorage.getItem("customerId") ?? null;
  const customerId =
    rawCustomerId === null || rawCustomerId === undefined ? null : Number(rawCustomerId);

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
        return obj && typeof obj === "object"
          ? (obj as Record<string, YearForm>)
          : {};
      } catch {
        return {};
      }
    })();

  // state -> sessionStorage 백업
  useEffect(() => {
    if (startYear) sessionStorage.setItem("startYear", startYear);
    if (endYear) sessionStorage.setItem("endYear", endYear);
    if (Number.isFinite(customerId))
      sessionStorage.setItem("customerId", String(customerId));
    if (Number.isFinite(caseId)) sessionStorage.setItem("caseId", String(caseId));
    if (yearsFromPrev.length > 0)
      sessionStorage.setItem("years", JSON.stringify(yearsFromPrev));
    if (Object.keys(_formsByYear).length > 0)
      sessionStorage.setItem("formsByYear", JSON.stringify(_formsByYear));
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

  // PDF 로딩/에러
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handlePickFile = (picked: File) => {
    const isPdf =
      picked.name.toLowerCase().endsWith(".pdf") || picked.type === "application/pdf";
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

  // 기존 코드 유지(안 쓰지만, 로직상 보존)
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
              <p className="mb-3 text-[12px] font-medium text-gray-700">
                현재 보고있는 파일
              </p>

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
                  isDragging
                    ? "border-[#64A5FF] bg-[#F3F8FF]"
                    : "border-gray-200 bg-[#FAFAFA] hover:bg-gray-50",
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left"
                >
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
                        (isPdfLoading || !currentPdfUrl) &&
                          "opacity-50 cursor-not-allowed hover:bg-white",
                      ].join(" ")}
                      aria-label="축소"
                    >
                      −
                    </button>

                    <div className="min-w-[52px] text-center text-[12px] text-gray-500">
                      {Math.round(scale * 100)}%
                    </div>

                    <button
                      type="button"
                      disabled={isPdfLoading || !currentPdfUrl}
                      onClick={() => setScale((s) => Math.min(2.0, +(s + 0.1).toFixed(2)))}
                      className={[
                        "h-8 rounded-full border border-gray-200 bg-white px-3 text-[12px] text-gray-600 hover:bg-gray-50",
                        (isPdfLoading || !currentPdfUrl) &&
                          "opacity-50 cursor-not-allowed hover:bg-white",
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
                        <div className="mt-2 text-[12px] text-gray-500">
                          콘솔(F12) 에러 메시지를 확인해 주세요.
                        </div>
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
                        loading={
                          <div className="py-10 text-center text-[13px] text-gray-400">
                            PDF 불러오는 중...
                          </div>
                        }
                        error={
                          <div className="py-10 text-center text-[13px] text-red-500">
                            PDF를 불러오지 못했어요.
                            <div className="mt-2 text-[12px] text-gray-500">
                              콘솔(F12) 에러 메시지를 확인해 주세요.
                            </div>
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
                                      active
                                        ? "border-[#64A5FF] ring-2 ring-[#64A5FF]/20"
                                        : "border-gray-200 hover:bg-gray-50",
                                      isPdfLoading &&
                                        "opacity-50 cursor-not-allowed hover:bg-white",
                                    ].join(" ")}
                                    aria-label={`${p}페이지로 이동`}
                                  >
                                    <div className="overflow-hidden rounded-[4px]">
                                      <Page
                                        pageNumber={p}
                                        scale={0.12}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                      />
                                    </div>
                                    <div className="mt-1 text-center text-[11px] text-gray-500">
                                      {p}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="h-[558px] overflow-auto border border-gray-200 bg-white">
                            <div className="flex justify-center p-4">
                              <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />
                            </div>
                          </div>
                        </div>
                      </Document>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 우측 OCR 결과 (분리된 패널) */}
            <OcrComparePanel
              caseId={caseId}
              openYears={openYears}
              activeYear={activeYear}
              sections={OCR_SECTIONS}
              onGoToStep3={handleGoToStep3}
            />
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
                active
                  ? "border-[#64A5FF] bg-[#64A5FF] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
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