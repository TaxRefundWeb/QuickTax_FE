import React, { useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { api } from "../../lib/api/client";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type RefundOutcomeStep = "review" | "completed";

type ResultDocumentsResponse = {
  isSuccess?: boolean;
  code?: string;
  message?: string;
  result?: {
    total_result?: {
      total_refund_amount?: number;
      total_file_url?: string;
    };
  };
};

type RefundOutcomeModalProps = {
  isOpen: boolean;
  step: RefundOutcomeStep;
  onClose: () => void;

  // 모달 오픈 시 documents GET에 필요
  caseId: number | string | null;

  refundAmount: number;

  /** (옵션) 외부에서 PDF를 주면 그걸 우선 사용. 없으면 caseId로 GET해서 띄움 */
  pdfFile?: string | File | Blob | null;

  /** review에서 "확정" 눌렀을 때 */
  onConfirm: () => void;

  /** completed에서 PDF 버튼 (안 주면 기본: total_file_url 새탭 오픈) */
  onDownloadPdf?: (pdfUrl?: string | null) => void;

  /** completed에서 "고객 선택하기" 버튼 */
  onSelectCustomer?: () => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [totalPdfUrl, setTotalPdfUrl] = useState<string | null>(null);

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

  const fetchDocuments = async () => {
    if (caseId == null || caseId === "") return;

    setDocLoading(true);
    setDocError(null);

    try {
      const res = await api.get<ResultDocumentsResponse>(
        `/result/${caseId}/documents`
      );

      const url = res.data?.result?.total_result?.total_file_url ?? null;

      if (!url) {
        setDocError("서류 PDF URL이 비어있습니다.");
        setTotalPdfUrl(null);
      } else {
        setTotalPdfUrl(url);
        setPage(1);
        setPageCount(1);
      }
    } catch (e) {
      console.error(e);
      setDocError("서류(PDF)를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setTotalPdfUrl(null);
    } finally {
      setDocLoading(false);
    }
  };

  // 모달 오픈 시 1회 GET (pdfFile이 있으면 스킵)
  useEffect(() => {
    if (!isOpen) return;
    if (pdfFile) return;
    if (totalPdfUrl) return;

    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, caseId, pdfFile]);

  // 모달 닫힐 때 정리(원하면 유지해도 됨)
  useEffect(() => {
    if (isOpen) return;
    setDocLoading(false);
    setDocError(null);
    setTotalPdfUrl(null);
    setPage(1);
    setPageCount(1);
  }, [isOpen]);

  // react-pdf에 넘길 파일: props(pdfFile) 우선, 없으면 totalPdfUrl
  const effectivePdfFile: string | File | Blob | null =
    pdfFile ?? totalPdfUrl ?? null;

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

        {/* 왼쪽 썸네일 */}
        <div className="absolute left-[120px] top-[144px] flex w-[120px] justify-center">
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
                    active ? "border-[#64A5FF] bg-blue-50" : "border-gray-200"
                  )}
                  aria-label={`${p}페이지 보기`}
                />
              );
            })}
          </div>
        </div>

        {/* 가운데 PDF */}
        <div className="absolute left-1/2 top-[128px] -translate-x-1/2">
          <div className="flex h-[640px] w-[487px] items-center justify-center rounded-[8px] border border-gray-200 bg-white">
            {docLoading && !effectivePdfFile ? (
              <div className="text-gray-500">서류를 불러오는 중…</div>
            ) : docError && !effectivePdfFile ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="text-gray-600">{docError}</div>
                <button
                  type="button"
                  onClick={fetchDocuments}
                  className="h-[34px] rounded-[8px] border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-800 hover:bg-gray-50"
                >
                  다시 시도
                </button>
              </div>
            ) : !effectivePdfFile ? (
              <div className="text-gray-400">PDF 미리보기를 불러올 수 없습니다</div>
            ) : (
              <Document
                file={effectivePdfFile}
                onLoadSuccess={(info) => setPageCount(info.numPages || 1)}
                loading={<div className="text-gray-500">PDF 로딩 중…</div>}
                error={<div className="text-gray-500">PDF 로딩 실패</div>}
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
                disabled={docLoading && !effectivePdfFile}
                className={cn(
                  "mt-10 h-[37px] w-[142px] rounded-[8px] border border-gray-200 bg-white text-[16px] font-semibold text-gray-800 hover:bg-gray-50",
                  docLoading && !effectivePdfFile && "opacity-50"
                )}
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
      </div>
    </div>
  );
}