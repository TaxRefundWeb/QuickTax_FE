import type { RefundPlan } from "../../data/customersDummy";

type Props = {
  plan: RefundPlan;
  selected?: boolean;
  best?: boolean;
  width: number;
};

export default function CalculationCard({
  plan,
  selected = false,
  best = false,
  width,
}: Props) {
  return (
    <div
      className={[
        "flex flex-col rounded-[32px] bg-white px-8 py-10",
        "shadow-[0_1px_10px_rgba(0,0,0,0.03)]",
        selected ? "border-[3px] border-[#64A5FF]" : "border-2 border-gray-100",
      ].join(" ")}
      style={{
        width: `${width}px`,
        height: "586px",
      }}
    >
      {/* 상단 뱃지 */}
      <div className="relative mb-[64px] flex justify-center -mt-4">
        <span className="rounded-full bg-[#64A5FF] px-5 py-1 text-[12px] font-semibold text-white">
          {plan.title}
        </span>

        {best && (
          <span className="absolute left-1/2 ml-[52px] rounded-md bg-[#FF8A00] px-2 py-1 text-[12px] font-bold text-white">
            BEST
          </span>
        )}
      </div>

      {/* 카드 내용*/}
      <div className="flex flex-col text-left pl-4">
        {/* 환급 예상액 */}
        <div className="mb-6">
          <div className="text-[16px] font-semibold text-black">
            환급 예상액
          </div>
          <div className="text-[28px] font-extrabold tracking-tight text-[#0061FE]">
            {plan.refundExpected.toLocaleString()}원
          </div>
        </div>

        {/* 보조 설명 */}
        <div className="mb-8 space-y-1 text-[12px] text-black">
          <div>실효세율: {plan.effectiveRate}%</div>
          <div>기존 대비 {plan.extraRefundPercent}% 추가 환급</div>
        </div>

        {/* 세부 금액 */}
        <div className="space-y-1 text-[12px] text-black">
          <div>산출세액: {plan.calculatedTax.toLocaleString()}원</div>
          <div>결정세액: {plan.determinedTax.toLocaleString()}원</div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="mt-auto pt-10 text-center font-inter text-[12px] font-medium text-[#B1B1B1] leading-normal">
        이 플랜 선택 시 예상 환급 시점: 신고 후 2개월 이내
      </div>
    </div>
  );
}
