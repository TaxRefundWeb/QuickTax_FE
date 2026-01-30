// components/modal/RefundOutcomeModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type RefundOutcomeStep = "review" | "completed";

type RefundOutcomeModalProps = {
  isOpen: boolean;
  step: RefundOutcomeStep;
  onClose: () => void;

  refundAmount: number;

  /** PDF 미리보기 소스 (URL / File / Blob 다 가능) */
  pdfFile?: string | File | Blob | null;

  /** review에서 "확정" 눌렀을 때 */
  onConfirm: () => void;

  /** completed에서 다운로드 버튼 */
  onDownloadPdf?: () => void;
  onDownloadZip?: () => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function RefundOutcomeModal({
  isOpen,
  step,
  onClose,
  refundAmount,
  pdfFile = null,
  onConfirm,
  onDownloadPdf,
  onDownloadZip,
}: RefundOutcomeModalProps) {
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);

  // 모달 열릴 때 페이지 초기화
  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
  }, [isOpen]);

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
    return step === "review"
      ? "확인 및 수정한 다음 확정버튼을 눌러주세요"
      : "";
  }, [step]);

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

        {/* 왼쪽 썸네일 */}
        <div className="absolute left-[120px] top-[144px] w-[120px] flex justify-center">
          <div className="space-y-4">
            {Array.from({ length: pageCount }).map((_, idx) => {
              const p = idx + 1;
              const active = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-[107px] w-[82px] rounded-[6px] border bg-gray-50",
                    active
                      ? "border-[#64A5FF] bg-blue-50"
                      : "border-gray-200"
                  )}
                  aria-label={`${p}페이지 보기`}
                />
              );
            })}
          </div>
        </div>

        {/* 가운데 PDF */}
        <div className="absolute left-1/2 top-[128px] -translate-x-1/2">
          <div className="rounded-[8px] border border-gray-200 bg-white h-[640px] w-[487px] flex items-center justify-center">
            {!pdfFile ? (
              <div className="text-gray-400">PDF 미리보기(더미)</div>
            ) : (
              <Document
                file={pdfFile}
                onLoadSuccess={(info) => setPageCount(info.numPages || 1)}
              >
                <Page pageNumber={page} width={455} />
              </Document>
            )}
          </div>

          <div className="mt-4 text-center text-[12px] text-gray-500">
            {page}/{pageCount}
          </div>
        </div>

        {/* 오른쪽 패널 */}
        <div className="absolute right-[30px] top-[128px] h-[640px] w-[260px]">
          {step === "review" ? (
            <div className="flex h-full flex-col items-center justify-end">
              <div className="w-[200px] text-left ml-14">
                <div className="text-[18px] font-semibold text-gray-800">
                  최종 환급액
                </div>
                <div className="text-[26px] font-extrabold text-[#0061FE]">
                  {refundAmount.toLocaleString()}원
                </div>
              </div>

              {/* 확정 버튼 */}
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
                onClick={onDownloadPdf}
                className="h-[40px] w-[138px] rounded-[8px] border border-gray-200 bg-white text-[12px] font-semibold text-gray-800 hover:bg-gray-50"
              >
                PDF 출력하기
              </button>
              <button
                type="button"
                onClick={onDownloadZip}
                className="h-[40px] w-[138px] rounded-[8px] border border-gray-200 bg-white text-[12px] font-semibold text-gray-800 hover:bg-gray-50"
              >
                zip 파일 다운로드
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
