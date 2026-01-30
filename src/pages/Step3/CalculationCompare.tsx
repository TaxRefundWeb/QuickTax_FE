import { useMemo, useState } from "react";
import CalculationCard from "../../components/card/CalculationCard";
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

export default function CalculationCompare({ customerId, year }: Props) {
  const fallbackCustomer = customersDummy[0] ?? null;

  const customer = useMemo(
    () => getCustomerById(customerId) ?? fallbackCustomer,
    [customerId, fallbackCustomer]
  );

  const years = useMemo(() => {
    if (!customer) return [];
    return Array.from(new Set(customer.records.map((r) => r.year))).sort(
      (a, b) => b - a
    );
  }, [customer]);

  const selectedYear = year ?? years[0] ?? null;

  const record = useMemo(() => {
    if (!customer || selectedYear === null) return null;
    return customer.records.find((r) => r.year === selectedYear) ?? null;
  }, [customer, selectedYear]);

  const plans = useMemo<RefundPlan[]>(() => record?.plans ?? [], [record]);

  const cardWidth = useMemo(
    () => (plans.length >= 3 ? 388 : 504),
    [plans.length]
  );

  const [pickedPlanId, setPickedPlanId] = useState<string | null>(null);

  const selectedPlanId = useMemo(() => {
    if (!plans.length) return null;

    if (pickedPlanId && plans.some((p) => p.id === pickedPlanId)) {
      return pickedPlanId;
    }

    return plans[0].id;
  }, [plans, pickedPlanId]);

  const pickedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const bestPlanId = useMemo(() => {
    if (!plans.length) return null;
    return plans.reduce((best, cur) =>
      cur.refundExpected > best.refundExpected ? cur : best
    ).id;
  }, [plans]);

  const onSubmit = () => {
    if (!pickedPlan) return;

    // TODO: Step4 모달 열기
  };


  return (
    <div className="w-full flex justify-center">
      <div className="w-[1400px]">
        <div className="flex justify-center gap-10">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const isBest = bestPlanId === plan.id;

            return (
              <div key={plan.id} className="flex flex-col items-center">
                <button
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setPickedPlanId(plan.id)}
                >
                  <CalculationCard
                    plan={plan}
                    selected={isSelected}
                    best={isBest}
                    width={cardWidth}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setPickedPlanId(plan.id)}
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

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!pickedPlan}
            className={cn(
              "h-[41px] w-[144px] rounded-[7px] border px-4 text-sm font-medium transition",
              pickedPlan
                ? "border-[#64A5FF] text-[#64A5FF] hover:bg-blue-50"
                : "cursor-not-allowed border-gray-200 text-gray-300"
            )}
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
}