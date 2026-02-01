import { useEffect, useMemo, useState } from "react";
import CalculationCard from "../../components/card/CalculationCard";
import RefundOutcomeModal, {
  type RefundOutcomeStep,
} from "../../components/modal/RefundOutcomeModal";
import {
  customersDummy,
  type Customer,
  type RefundPlan,
} from "../../data/customersDummy";

type Props = {
  customerId?: string;
  year?: number;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getCustomerById(id?: string | null): Customer | null {
  if (!id) return null;
  return customersDummy.find((c) => c.id === id) ?? null;
}

function YearTabs({
  years,
  activeYear,
  onChange,
}: {
  years: number[];
  activeYear: number | null;
  onChange: (y: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {years.map((y) => {
        const active = y === activeYear;

        return (
          <button
            key={y}
            type="button"
            onClick={() => onChange(y)}
            className={cn(
              "h-[44px] w-[120px] rounded-t-[10px] border text-sm transition",
              "border-b-0",
              active
                ? "border-[#64A5FF] bg-[#64A5FF] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            {String(y).slice(-2)}년
          </button>
        );
      })}
    </div>
  );
}

export default function CalculationCompare({ customerId, year }: Props) {
  const fallbackCustomer = customersDummy[0] ?? null;

  const customer = useMemo(
    () => getCustomerById(customerId) ?? fallbackCustomer,
    [customerId, fallbackCustomer]
  );

  const years = useMemo(() => {
    if (!customer) return [];
    return Array.from(new Set(customer.records.map((r) => r.year))).sort(
      (a, b) => a - b
    );
  }, [customer]);

  const [activeYear, setActiveYear] = useState<number | null>(() => {
    return year ?? years[0] ?? null;
  });

  const [pickedPlanIdByYear, setPickedPlanIdByYear] = useState<
    Record<number, string | null>
  >({});

  const basePlans = useMemo<RefundPlan[]>(() => {
    if (!customer || !years.length) return [];
    const baseYear = years[0]; // 최신 연도
    return customer.records.find((r) => r.year === baseYear)?.plans ?? [];
  }, [customer, years]);

  const plans = basePlans;

  const cardWidth = useMemo(
    () => (plans.length >= 3 ? 388 : 504),
    [plans.length]
  );

  const bestPlanId = useMemo(() => {
    if (!plans.length) return null;
    return plans.reduce((best, cur) =>
      cur.refundExpected > best.refundExpected ? cur : best
    ).id;
  }, [plans]);

  useEffect(() => {
    if (!years.length || !bestPlanId) return;

    setPickedPlanIdByYear((prev) => {
      let changed = false;
      const next: Record<number, string | null> = { ...prev };

      for (const y of years) {
        if (!next[y]) {
          next[y] = bestPlanId;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [years, bestPlanId]);

  // 2) 탭(연도) 바꿨을 때도 혹시 값이 없으면 best로 채움
  useEffect(() => {
    if (activeYear === null || !bestPlanId) return;
    setPickedPlanIdByYear((prev) => {
      if (prev[activeYear]) return prev;
      return { ...prev, [activeYear]: bestPlanId };
    });
  }, [activeYear, bestPlanId]);

  const selectedPlanId = useMemo(() => {
    if (!plans.length || activeYear === null) return null;
    const picked = pickedPlanIdByYear[activeYear] ?? null;

    if (picked && plans.some((p) => p.id === picked)) return picked;

    if (bestPlanId) return bestPlanId;

    return null;
  }, [plans, activeYear, pickedPlanIdByYear, bestPlanId]);

  const isAllYearsPicked = useMemo(() => {
    if (!years.length) return false;
    return years.every((y) => !!pickedPlanIdByYear[y]);
  }, [years, pickedPlanIdByYear]);

  const totalRefund = useMemo(() => {
    return years.reduce((sum, y) => {
      const pid = pickedPlanIdByYear[y];
      if (!pid) return sum;
      const plan = basePlans.find((p) => p.id === pid);
      return sum + (plan?.refundExpected ?? 0);
    }, 0);
  }, [years, pickedPlanIdByYear, basePlans]);

  const onPickPlan = (planId: string) => {
    if (activeYear === null) return;
    setPickedPlanIdByYear((prev) => ({ ...prev, [activeYear]: planId }));
  };

  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const [outcomeStep, setOutcomeStep] = useState<RefundOutcomeStep>("review");

  const onSubmit = () => {
    if (!isAllYearsPicked) return;
    setOutcomeStep("review");
    setIsOutcomeOpen(true);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-[1300px]">
        <div className="relative mt-6">
          <div className="absolute -top-[44px]">
            <YearTabs
              years={years}
              activeYear={activeYear}
              onChange={setActiveYear}
            />
          </div>

          {/* 큰 네모 컨테이너 */}
          <div
            className={cn(
              "rounded-[12px] rounded-tl-none border border-gray-200 bg-white",
              "px-10 pt-10 pb-6",
              "shadow-[0_1px_10px_rgba(0,0,0,0.04)]"
            )}
          >
            {/* 카드 영역 */}
            <div className="flex justify-center gap-10">
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                const isBest = bestPlanId === plan.id;

                return (
                  <div key={plan.id} className="flex flex-col items-center">
                    <button
                      type="button"
                      className="focus:outline-none"
                      onClick={() => onPickPlan(plan.id)}
                    >
                      <CalculationCard
                        plan={plan}
                        selected={isSelected}
                        best={isBest}
                        width={cardWidth}
                      />
                    </button>

                    {/* 아래 체크 버튼 */}
                    <button
                      type="button"
                      onClick={() => onPickPlan(plan.id)}
                      aria-label={`${plan.title} 선택`}
                      className={cn(
                        "mt-4 flex h-[56px] w-[56px] items-center justify-center rounded-full transition",
                        isSelected
                          ? "border-[3px] border-[#64A5FF] bg-white shadow-sm"
                          : "border-2 border-gray-200 bg-white"
                      )}
                    >
                      <svg
                        width="26"
                        height="19"
                        viewBox="0 0 26 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cn(
                          "transition-colors",
                          isSelected ? "text-[#64A5FF]" : "text-gray-300"
                        )}
                      >
                        <path
                          d="M2 9.5L9.2 16.5L24 2"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 선택 완료 버튼: 컨테이너 밖(아래) */}
          <div className="mt-8 mb-8 flex justify-end">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!isAllYearsPicked}
              className={cn(
                "h-[41px] w-[144px] rounded-[7px] border px-4 text-sm font-medium transition",
                isAllYearsPicked
                  ? "border-[#64A5FF] text-[#64A5FF] hover:bg-blue-50"
                  : "cursor-not-allowed border-gray-200 text-gray-300"
              )}
            >
              선택 완료
            </button>
          </div>
        </div>

        {/* Step4 모달 연결 */}
        <RefundOutcomeModal
          isOpen={isOutcomeOpen}
          step={outcomeStep}
          onClose={() => setIsOutcomeOpen(false)}
          refundAmount={totalRefund}
          pdfFile={null}
          onConfirm={() => setOutcomeStep("completed")}
          onDownloadPdf={() => console.log("PDF 출력하기")}
          onDownloadZip={() => console.log("ZIP 파일 다운로드")}
        />
      </div>
    </div>
  );
}
