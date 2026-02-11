import { useState } from "react";
import OCRresult, { type OcrSection } from "../../../components/card/OCRresult";
import PatchModal from "../../../components/modal/PatchModal";
import { useOcrCompare } from "../hooks/useOcrCompare";

import type { OcrYearData } from "../../../lib/api/ocr";

export default function OcrComparePanel(props: {
  caseId: number | null;
  openYears: number[];
  activeYear: string;
  sections: OcrSection[];
  onGoToStep3: () => void;
}) {
  const { caseId, openYears, activeYear, sections, onGoToStep3 } = props;

  const {
    isOcrLoading,
    ocrStatus,
    ocrError,
    currentDraft,
    handleChangeOcrField,
    submitButtonLabel,
    isPatchLoading,
    submitPatchAllYears,
  } = useOcrCompare({ caseId, openYears, activeYear });

  const [isPatchModalOpen, setIsPatchModalOpen] = useState(false);

  const isReady = ocrStatus === "READY" || ocrStatus === "DONE";

  const handleSubmitOcr = async () => {
    if (!isReady) return;

    const result = await submitPatchAllYears();

    if (!result.ok) {
      if (result.reason === "not_dirty") return;
      if (result.reason === "failed") {
        alert(result.message || "OCR 수정 저장에 실패했어요.");
        return;
      }
      if (result.reason === "no_caseId") return;
      alert("수정 저장 중 오류가 발생했어요. 콘솔을 확인해주세요.");
      return;
    }

    setIsPatchModalOpen(true);
  };

  const data = currentDraft as OcrYearData | null;

  const showProcessing = isOcrLoading || ocrStatus === "PROCESSING";
  const showWaiting = ocrStatus === "WAITING_UPLOAD" || ocrStatus === null;
  const showFailed = ocrStatus === "FAILED" || Boolean(ocrError);

  return (
    <div className="h-full bg-white flex flex-col items-center">
      <div className="w-[600px]">
        <div className="pt-6 pl-[40px]">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[18px] text-gray-800">OCR 인식 결과</p>
            <span className="text-[12px] text-gray-400">ⓘ</span>
          </div>
          <p className="mb-4 text-[14px] text-gray-500">
            좌측의 원본 서류와 비교하여 수정해주세요
          </p>
        </div>
      </div>

      {showProcessing ? (
        <div className="flex-1 w-[600px] mx-auto max-h-[600px] rounded-[8px] overflow-hidden">
          <div className="h-full flex items-center justify-center bg-[#F3F8FF] px-6 py-5">
            <div className="text-center flex flex-col items-center">
              <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#64A5FF]" />
              <div className="text-[14px] text-gray-600">OCR 결과를 분석 중입니다…</div>
              <div className="mt-1 text-[12px] text-gray-400">잠시만 기다려 주세요</div>
            </div>
          </div>
        </div>
      ) : showWaiting ? (
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
      ) : showFailed ? (
        <div className="flex-1 w-[600px] mx-auto max-h-[600px] rounded-[8px] overflow-hidden">
          <div className="h-full flex items-center justify-center bg-[#F3F8FF] px-6 py-5">
            <div className="text-center">
              <div className="text-[14px] text-red-500">
                {ocrError ?? "OCR 결과를 불러오지 못했어요."}
              </div>
              <div className="mt-1 text-[12px] text-gray-400">
                (status: {ocrStatus ?? "-"})
              </div>
            </div>
          </div>
        </div>
      ) : (
        <OCRresult sections={sections} data={data} editable onChange={handleChangeOcrField} />
      )}

      {/* 하단 버튼 */}
      <div className="w-[600px] mt-6 flex justify-end px-0 py-2">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isPatchLoading || !isReady}
            onClick={handleSubmitOcr}
            className={[
              "h-[40px] w-[120px] rounded-[6px] border border-gray-200 bg-white text-[13px] text-gray-700 hover:bg-gray-50",
              (isPatchLoading || !isReady) && "opacity-50 cursor-not-allowed hover:bg-white",
            ].join(" ")}
            title={!isReady ? "OCR이 READY가 된 뒤 수정/저장이 가능해요." : undefined}
          >
            {isPatchLoading ? "저장 중…" : submitButtonLabel}
          </button>

          <button
            type="button"
            disabled={!isReady}
            onClick={onGoToStep3}
            className={[
              "h-[40px] w-[120px] rounded-[6px] bg-[#64A5FF] text-[13px] font-medium text-white hover:bg-[#4F93FF]",
              !isReady && "opacity-50 cursor-not-allowed hover:bg-[#64A5FF]",
            ].join(" ")}
            title={!isReady ? "OCR이 READY가 된 뒤 계산할 수 있어요." : undefined}
          >
            {isReady ? "계산하기" : "OCR 처리중"}
          </button>
        </div>
      </div>

      {/* PATCH 성공 모달 */}
      <PatchModal open={isPatchModalOpen} onClose={() => setIsPatchModalOpen(false)} />
    </div>
  );
}
