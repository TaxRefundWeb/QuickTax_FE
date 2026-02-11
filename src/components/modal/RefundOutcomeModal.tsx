import React, { useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type RefundOutcomeStep = "review" | "completed";

type RefundOutcomeModalProps = {
  isOpen: boolean;
  step: RefundOutcomeStep;
  onClose: () => void;

  caseId: number | string | null;
  refundAmount: number;

  /** (옵션) 외부에서 PDF를 주면 그걸 우선 사용. 없으면 mock pdf 사용 */
  pdfFile?: string | File | Blob | null;

  onConfirm: () => void;
  onDownloadPdf?: (pdfUrl?: string | null) => void;
  onSelectCustomer?: () => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ✅ public/mock/sample.pdf 에 넣는 것을 가정
const MOCK_PDF_URL = "/sample.pdf";

export default function RefundOutcomeModal({
  isOpen,
  step,
  onClose,
  caseId,
  refundAmount,
  pdfFile = null,
  onConfirm,
  onDownloadPdf,
  onSelectCustomer,
}: RefundOutcomeModalProps) {
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);

  // ✅ 더미: 항상 이 URL을 사용(외부 pdfFile이 있으면 그게 우선)
  const totalPdfUrl = MOCK_PDF_URL;

  // ESC 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  // 바깥 클릭 닫기
  const onDimClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const title = useMemo(() => {
    return step === "review"
      ? "선택하신 계산식 기반 경정청구서 초안"
      : "경정청구 준비가 모두 완료되었습니다";
  }, [step]);

  const subtitle = useMemo(() => {
    return step === "review" ? "확인 및 수정한 다음 확정버튼을 눌러주세요" : "";
  }, [step]);

  // react-pdf에 넘길 파일: props(pdfFile) 우선, 없으면 MOCK_PDF_URL
  const effectivePdfFile: string | File | Blob | null =
    pdfFile ?? totalPdfUrl ?? null;

  // 모달 닫힐 때 페이지 초기화
  useEffect(() => {
    if (isOpen) return;
    setPage(1);
    setPageCount(1);
  }, [isOpen]);

  const handleDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf(totalPdfUrl);
      return;
    }
    if (totalPdfUrl) window.open(totalPdfUrl, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onMouseDown={onDimClick}
    >
      {/* 모달 래퍼 */}
      <div className="relative h-[832px] w-[1084px] rounded-[24px] bg-white px-10 py-8 shadow-xl">
        {/* 상단 타이틀 */}
        <div className="mt-2 text-center">
          <h2 className="text-[20px] font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-[16px] text-gray-500">{subtitle}</p>
          ) : (
            <div className="mt-2 h-[18px]" />
          )}
        </div>

        {/* ✅ Document는 1번만 로드하고, 썸네일/메인 모두 동일 컨텍스트 사용 */}
        <div className="absolute left-1/2 top-[128px] -translate-x-1/2">
          <Document
            file={effectivePdfFile}
            onLoadSuccess={(info) => setPageCount(info.numPages || 1)}
            loading={
              <div className="flex h-[640px] w-[487px] items-center justify-center rounded-[8px] border border-gray-200 bg-white">
                <div className="text-gray-500">PDF 로딩 중…</div>
              </div>
            }
            error={
              <div className="flex h-[640px] w-[487px] items-center justify-center rounded-[8px] border border-gray-200 bg-white">
                <div className="text-gray-500">PDF 로딩 실패</div>
              </div>
            }
          >
            {/* ✅ 왼쪽 썸네일: 모달 안쪽으로 당겨서 배치 */}
            <div className="absolute left-[-200px] top-[0px] w-[120px]">
              <div className="h-[640px] w-[120px] overflow-y-auto pr-2 space-y-3">
                {Array.from({ length: pageCount }).map((_, idx) => {
                  const p = idx + 1;
                  const active = p === page;

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "shrink-0 w-[90px] h-[120px] rounded-[8px] border bg-white overflow-hidden",
                        active
                          ? "border-[#64A5FF] ring-2 ring-blue-200"
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                      aria-label={`${p}페이지 보기`}
                    >
                      <Page
                        pageNumber={p}
                        width={90}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 가운데 PDF 메인 */}
            <div className="flex h-[640px] w-[487px] items-center justify-center rounded-[8px] border border-gray-200 bg-white overflow-hidden">
              <Page
                pageNumber={page}
                width={455}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>

            <div className="mt-4 text-center text-[12px] text-gray-500">
              {page}/{pageCount}
            </div>
          </Document>
        </div>

        {/* 오른쪽 패널 */}
        <div className="absolute right-[30px] top-[128px] h-[640px] w-[260px]">
          {step === "review" ? (
            <div className="flex h-full flex-col items-center justify-end">
              <div className="ml-14 w-[200px] text-left">
                <div className="text-[18px] font-semibold text-gray-800">
                  최종 환급액
                </div>
                <div className="text-[26px] font-extrabold text-[#0061FE]">
                  {refundAmount.toLocaleString()}원
                </div>
              </div>

              <button
                type="button"
                onClick={onConfirm}
                className="mt-10 h-[37px] w-[142px] rounded-[8px] border border-gray-200 bg-white text-[16px] font-semibold text-gray-800 hover:bg-gray-50"
              >
                확정
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!totalPdfUrl}
                className={cn(
                  "h-[40px] w-[138px] rounded-[8px] border border-gray-200 bg-white text-[12px] text-gray-800 hover:bg-gray-50",
                  !totalPdfUrl && "opacity-50"
                )}
              >
                PDF 출력하기
              </button>

              <button
                type="button"
                onClick={onSelectCustomer}
                className="h-[40px] w-[138px] rounded-[8px] bg-[#0061FE] text-[12px] text-white hover:brightness-95 active:brightness-90"
              >
                고객 선택하기
              </button>
            </div>
          )}
        </div>

        {/* (선택) 디버그 */}
        <div className="absolute bottom-4 left-6 text-[11px] text-gray-300">
          caseId: {String(caseId ?? "-")}
        </div>
      </div>
    </div>
  );
}