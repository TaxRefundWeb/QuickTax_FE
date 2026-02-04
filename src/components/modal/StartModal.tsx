import { useEffect } from "react";

type StartModalProps = {
  open: boolean;
  userName?: string;
  onClose: () => void;
  onBack: () => void; // ⬅ 고객 선택으로 돌아가기
  onLoadPrevious: () => void;
  onStartNew: () => void;
};

export default function StartModal({
  open,
  userName = "OOO",
  onClose,
  onBack,
  onLoadPrevious,
  onStartNew,
}: StartModalProps) {
  // ESC 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* modal box */}
      <div
        className="relative flex h-[500px] w-[764px] max-w-[92vw] items-center justify-center rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 뒤로가기 버튼 */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.stopPropagation();
            onBack();
          }}
          aria-label="고객 다시 선택"
          className="absolute left-6 top-8 z-20 flex h-9 w-9 items-center justify-center text-gray hover:brightness-95 active:brightness-90"
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.5 19L8.5 12L15.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        </button>

        {/* content wrapper */}
        <div className="flex flex-col items-center px-10 text-center">
          {/* 원 + 타이틀 한 줄 */}
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <h2 className="text-[24px] font-semibold text-gray-900">
              <span className="text-[#64A5FF]">{userName}님</span>
              <span>의 업무를 시작합니다.</span>
            </h2>
          </div>

          {/* 설명 문구 */}
          <p className="text-[16px] leading-6 text-gray-500">
            원하시는 작업을 선택해 주세요.
            <br />
            새로운 경정청구 신청을 시작하거나 기존 기록을 확인할 수 있습니다.
          </p>

          {/* 버튼 영역 */}
          <div className="mt-[80px] flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onLoadPrevious}
              className="h-[83px] w-[280px] rounded-lg border border-gray-200 bg-white text-[16px] font-bold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              이전 기록 불러오기
            </button>

            <button
              type="button"
              onClick={onStartNew}
              className="h-[83px] w-[280px] rounded-lg bg-[#0061FE] text-[16px] font-semibold text-white shadow-sm hover:brightness-95 active:brightness-90"
            >
              새 경정청구 신청하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
