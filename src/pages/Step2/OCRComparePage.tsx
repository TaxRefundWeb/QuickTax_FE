import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PeriodState = {
  startYear?: string;
  endYear?: string;
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
  years?: string[]; // ["2020","2021",...]
  formsByYear?: Record<string, YearForm>;
};

type OcrRow = {
  label: string;
  badge?: string;
};

type OcrSection = {
  title: string;
  rows: OcrRow[];
};

const OCR_SECTIONS: OcrSection[] = [
  {
    title: "1. 소득명세",
    rows: [
      { label: "총급여", badge: "16" },
      { label: "근무처 1 합계", badge: "21" },
      { label: "근무처 2 합계", badge: "21" },
    ],
  },
  {
    title: "2. 소득공제",
    rows: [
      { label: "근로소득공제", badge: "22" },
      { label: "근로소득금액", badge: "23" },
      { label: "기본공제 본인", badge: "24" },
      { label: "기본공제 배우자", badge: "25" },
      { label: "기본공제 부양가족", badge: "26" },
      { label: "국민연금보험료 공제금액", badge: "31-2" },
      { label: "특별소득공제 합계", badge: "36" },
      { label: "차감소득금액", badge: "37" },
      { label: "그 외 소득공제 계", badge: "47" },
    ],
  },
  {
    title: "3. 과세표준 및 산출세액 / 감면",
    rows: [
      { label: "종합소득 과세표준", badge: "49" },
      { label: "산출세액", badge: "50" },
      { label: "세액감면 합계", badge: "55" },
    ],
  },
  {
    title: "4. 세액공제",
    rows: [
      { label: "근로소득", badge: "56" },
      { label: "자녀 공제대상자녀", badge: "57-1" },
      { label: "자녀 출산/입양자", badge: "57-2" },
      { label: "월세액 세액 공제금액", badge: "70-2" },
      { label: "세액공제 계", badge: "71" },
      { label: "결정세액", badge: "72" },
    ],
  },
];

export default function OcrComparePage() {
  const location = useLocation();
  const navigate = useNavigate();

  /** Existing에서 넘어온 state */
  const navState = (location.state as OcrNavState | null) ?? null;

  const startYear = navState?.period?.startYear ?? "";
  const endYear = navState?.period?.endYear ?? "";
  const yearsFromPrev = navState?.years ?? [];
  const formsByYear = navState?.formsByYear ?? {};

  /** state 없이 직접 접근하면 Step1 기간선택으로 보내기 */
  useEffect(() => {
    if (!startYear || !endYear || yearsFromPrev.length === 0) {
      navigate("/step1/period", { replace: true });
    }
  }, [startYear, endYear, yearsFromPrev.length, navigate]);

  /** 상단: 연도 탭을 Existing에서 넘어온 years로 세팅 */
  const [openYears, setOpenYears] = useState<number[]>([]);
  const [activeYear, setActiveYear] = useState<string>("");

  useEffect(() => {
    const parsed = yearsFromPrev
      .map((y) => Number(y))
      .filter((n) => !Number.isNaN(n));

    if (parsed.length === 0) return;

    setOpenYears(parsed);
    setActiveYear(String(parsed[0]));
  }, [yearsFromPrev]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 연도별 선택 파일 저장
  const [filesByYear, setFilesByYear] = useState<Record<string, File | null>>(
    {}
  );

  // 연도별 PDF URL 저장 (ObjectURL)
  const [pdfUrlByYear, setPdfUrlByYear] = useState<Record<string, string>>({});

  // 현재 activeYear의 파일명 표시용
  const selectedFileName = useMemo(() => {
    const f = filesByYear[activeYear];
    return f?.name ?? "";
  }, [filesByYear, activeYear]);

  // 파일 선택 처리: activeYear에 매핑 저장 + PDF URL 생성
  const handlePickFile = (file: File) => {
    if (!activeYear) return;

    const isPdf =
      file.name.toLowerCase().endsWith(".pdf") ||
      file.type === "application/pdf";

    if (!isPdf) {
      alert("PDF 파일만 업로드할 수 있어요!");
      return;
    }

    setFilesByYear((prev) => ({ ...prev, [activeYear]: file }));

    setPdfUrlByYear((prev) => {
      // 기존 url 있으면 revoke (메모리 누수 방지)
      const prevUrl = prev[activeYear];
      if (prevUrl) URL.revokeObjectURL(prevUrl);

      const nextUrl = URL.createObjectURL(file);
      return { ...prev, [activeYear]: nextUrl };
    });
  };

  // 컴포넌트 언마운트 시 revoke
  useEffect(() => {
    return () => {
      Object.values(pdfUrlByYear).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** PDF 뷰어 상태 */
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);

  // 연도 바뀌면 페이지 1 + scale 초기화
  useEffect(() => {
    setPageNumber(1);
    setScale(1);
  }, [activeYear]);

  const currentPdfUrl = pdfUrlByYear[activeYear] ?? "";

  /** (선택) 연도 변경 시, 해당 연도의 입력데이터가 있는지 확인용 로그 */
  useEffect(() => {
    if (!activeYear) return;
    // console.log("선택 연도:", activeYear, formsByYear[activeYear]);
  }, [activeYear, formsByYear]);

  return (
    <div className="w-screen flex justify-center">
      <div className="w-[1152px]">
        {/* 상단 */}
        <div className="-mt-[120px]">
          <div className="grid grid-cols-[260px_1fr] gap-6">
            {/* 현재 파일 */}
            <div className="rounded-[12px] border border-gray-200 bg-white p-4">
              <p className="mb-3 text-[12px] font-medium text-gray-700">
                현재 보고있는 파일
              </p>

              {/* 숨김 파일 input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  handlePickFile(file);

                  // 같은 파일 다시 선택 가능하게 초기화
                  e.currentTarget.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-[10px] border border-gray-200 bg-[#FAFAFA] p-3 text-left hover:bg-gray-50"
              >
                {selectedFileName ? (
                  <>
                    <div className="text-[13px] text-gray-700">
                      {selectedFileName}
                    </div>
                    <div className="mt-1 text-[12px] text-gray-400">
                      클릭해서 파일 변경
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[13px] font-medium text-gray-700">
                      파일 불러오기
                    </div>
                    <div className="mt-1 text-[12px] text-gray-400">
                      클릭해서 파일 선택
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* 연도 탭 */}
            <div className="rounded-[8px] border border-gray-200 bg-white p-4">
              <p className="mb-3 text-[12px] font-medium text-gray-700">
                년도별 인식 결과
              </p>

              <YearTabs
                years={openYears}
                activeKey={activeYear}
                onChange={setActiveYear}
              />
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
                  {/* 확대/축소 */}
                  <div className="ml-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))
                      }
                      className="h-8 rounded-full border border-gray-200 bg-white px-3 text-[12px] text-gray-600 hover:bg-gray-50"
                      aria-label="축소"
                    >
                      −
                    </button>

                    <div className="min-w-[52px] text-center text-[12px] text-gray-500">
                      {Math.round(scale * 100)}%
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setScale((s) => Math.min(2.0, +(s + 0.1).toFixed(2)))
                      }
                      className="h-8 rounded-full border border-gray-200 bg-white px-3 text-[12px] text-gray-600 hover:bg-gray-50"
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
                  <div className="flex h-full items-center justify-center text-[13px] text-gray-400">
                    {activeYear
                      ? `${activeYear}년 PDF를 불러와 주세요.`
                      : "연도를 선택해 주세요."}
                  </div>
                ) : (
                  <div className="h-full p-4">
                    <Document
                      file={currentPdfUrl}
                      onLoadSuccess={(info) => {
                        setNumPages(info.numPages);
                        setPageNumber(1);
                      }}
                      onLoadError={(err) =>
                        console.error("PDF onLoadError:", err)
                      }
                      onSourceError={(err) =>
                        console.error("PDF onSourceError:", err)
                      }
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
                      {/* 상단 정보 */}
                      <div className="mb-3 flex items-center justify-between text-[12px] text-gray-500">
                        <span>
                          {pageNumber} / {numPages || "-"}
                        </span>
                        <span className="text-gray-400">
                          (연도: {activeYear || "-"})
                        </span>
                      </div>

                      {/* 썸네일 + 본문 */}
                      <div className="grid h-[calc(100%-72px)] grid-cols-[92px_1fr] gap-4">
                        {/* 썸네일 리스트 */}
                        <div className="h-full overflow-auto pr-1">
                          <div className="space-y-2">
                            {Array.from({ length: numPages || 0 }, (_, i) => {
                              const p = i + 1;
                              const active = p === pageNumber;

                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setPageNumber(p)}
                                  className={[
                                    "w-full rounded-[6px] border bg-white p-1 text-left transition",
                                    active
                                      ? "border-[#64A5FF] ring-2 ring-[#64A5FF]/20"
                                      : "border-gray-200 hover:bg-gray-50",
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

                        {/* 본문 페이지 */}
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
                  </div>
                )}
              </div>
            </div>

            {/* 우측 OCR 결과 */}
            <OcrFixedPanel activeYear={activeYear} />
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

/** 오른쪽: 사진처럼 고정된 OCR 폼(빈칸은 서버값으로 나중에 채움) */
function OcrFixedPanel({ activeYear }: { activeYear: string }) {
  return (
    <div className="h-full bg-white flex flex-col">
      {/* 헤더 */}
      <div className="ml-[38px] p-6">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-[18px] font-semibold text-gray-800">OCR 인식 결과</p>
          <span className="text-[12px] text-gray-400">ⓘ</span>
        </div>
        <p className="text-[14px] text-gray-500">
          좌측의 원본 서류와 비교하여 수정해주세요
        </p>
      </div>

      {/* 파란 폼 영역 */}
    <div className="flex-1 w-[530px] mx-auto max-h-[600px] rounded-[8px] overflow-hidden">
        {/* 스크롤은 바깥에서 담당 (우측 테두리에 딱 붙음) */}
        <div className="h-full overflow-auto">
            {/* 파란 배경 + 패딩은 안쪽으로 */}
            <div className="bg-[#F3F8FF] px-6 py-5 min-h-full">
                {OCR_SECTIONS.map((sec, idx) => (
                    <div key={sec.title}>
                        <h2 className="mb-4 text-[16px] font-semibold text-gray-800">
                            {sec.title}
                        </h2>

                        <div className="pl-5 space-y-3">
                            {sec.rows.map((row) => (
                                <OcrFixedRow key={`${sec.title}-${row.label}`} row={row} />
                            ))}
                        </div>

                        {idx !== OCR_SECTIONS.length - 1 ? (
                            <div className="my-5 h-px bg-[#D8E6FF]" />
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    </div>


      {/* 버튼 영역 */}
      <div className="px-6 py-2 mt-6">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="h-[40px] w-[120px] rounded-[6px] border border-gray-200 bg-white text-[13px] text-gray-700 hover:bg-gray-50"
          >
            수정하기
          </button>

          <button
            type="button"
            className="h-[40px] w-[120px] rounded-[6px] bg-[#64A5FF] text-[13px] font-medium text-white hover:bg-[#4F93FF]"
          >
            계산하기
          </button>
        </div>
      </div>
    </div>
  );
}

function OcrFixedRow({ row }: { row: OcrRow }) {
  return (
    <div className="grid grid-cols-[1fr_220px] items-center gap-3">
      {/* 왼쪽: 라벨 (길어지면 여기서만 영향을 받음) */}
      <span className="font-inter text-[16px] font-medium text-[#6D6D6D] leading-normal">
        {row.label}
      </span>

      {/* 오른쪽: badge + 입력칸 (항상 같은 시작 위치) */}
      <div className="flex items-center justify-end gap-1">
        {row.badge ? (
          <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[#E7F0FF] px-2 text-[10px] font-medium text-[#2F6FED]">
            {row.badge}
          </span>
        ) : null}

        <div className="h-[36px] w-[180px] rounded-[6px] border border-gray-200 bg-white" />
      </div>
    </div>
  );
}
