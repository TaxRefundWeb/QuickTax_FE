import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CalculationCard from "../../components/card/CalculationCard";
import RefundOutcomeModal, {
  type RefundOutcomeStep,
} from "../../components/modal/RefundOutcomeModal";

// 기존 카드 props 타입을 그대로 쓰고 싶어서 유지
import type { RefundPlan } from "../../data/customersDummy";
import { getCalculationResult, type Scenario } from "../../lib/api/result";

type Props = {
  year?: number;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

// API Scenario -> RefundPlan 변환
function scenarioToPlan(s: Scenario, idx: number): RefundPlan {
  const effectiveRate =
    s.tax_base_amount && s.tax_base_amount !== 0
      ? Math.round((s.calculated_tax / s.tax_base_amount) * 100)
      : 0;

  const extraRefundPercent =
    s.determined_tax_amount && s.determined_tax_amount !== 0
      ? Math.round((s.tax_difference_amount / s.determined_tax_amount) * 100)
      : 0;

  return {
    id: s.scenario_code,
    title: `PLAN ${idx + 1}`,
    refundExpected: s.refund_amount,
    effectiveRate,
    extraRefundPercent,
    calculatedTax: s.calculated_tax,
    determinedTax: s.determined_tax_amount,
  };
}

export default function CalculationCompare({ year }: Props) {
  const navigate = useNavigate();

  const params = useParams<{ caseId: string }>();
  const caseIdParam = params.caseId ?? null;

  const [refundResults, setRefundResults] = useState<
    Array<{ case_year: number; scenarios: Scenario[] }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!caseIdParam) {
      setErrorMsg("caseId가 없습니다. URL을 확인해 주세요. (/compare/:caseId)");
      return;
    }

    const numericCaseId = Number(caseIdParam);
    if (Number.isNaN(numericCaseId)) {
      setErrorMsg("caseId가 숫자가 아닙니다. 라우팅/파라미터를 확인해 주세요.");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const data = await getCalculationResult(numericCaseId);
        const list = data.result?.refund_results ?? [];

        setRefundResults(list);
      } catch (e) {
        console.error(e);
        setErrorMsg(
          "계산 결과를 불러오지 못했습니다. 콘솔/네트워크를 확인해 주십시오."
        );
        setRefundResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseIdParam]);

  const years = useMemo(() => {
    return refundResults.map((r) => r.case_year).sort((a, b) => a - b);
  }, [refundResults]);

  // activeYear 초기값 (API 로딩 후 years 생기는 타이밍 보정)
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    if (activeYear !== null) return;
    if (!years.length) return;
    setActiveYear(year ?? years[0]);
  }, [years, year, activeYear]);

  const plansByYear = useMemo(() => {
    const map = new Map<number, RefundPlan[]>();

    for (const rr of refundResults) {
      const plans = (rr.scenarios ?? []).map((s, idx) => scenarioToPlan(s, idx));
      map.set(rr.case_year, plans);
    }

    return map;
  }, [refundResults]);

  // 현재 탭(연도)의 plans
  const plans = useMemo<RefundPlan[]>(() => {
    if (activeYear === null) return [];
    return plansByYear.get(activeYear) ?? [];
  }, [plansByYear, activeYear]);

  const [pickedPlanIdByYear, setPickedPlanIdByYear] = useState<
    Record<number, string | null>
  >({});

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

  // years가 생기면(또는 bestPlanId가 바뀌면) 모든 연도 기본 선택(best) 채워넣기
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

  // 현재 activeYear도 기본 선택(best) 보정
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

    return bestPlanId ?? null;
  }, [plans, activeYear, pickedPlanIdByYear, bestPlanId]);

  const isAllYearsPicked = useMemo(() => {
    if (!years.length) return false;
    return years.every((y) => !!pickedPlanIdByYear[y]);
  }, [years, pickedPlanIdByYear]);

  const totalRefund = useMemo(() => {
    return years.reduce((sum, y) => {
      const pid = pickedPlanIdByYear[y];
      if (!pid) return sum;

      const list = plansByYear.get(y) ?? [];
      const plan = list.find((p) => p.id === pid);

      return sum + (plan?.refundExpected ?? 0);
    }, 0);
  }, [years, pickedPlanIdByYear, plansByYear]);

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
          {/* 탭 */}
          <div className="absolute -top-[44px]">
            <YearTabs
              years={years}
              activeYear={activeYear}
              onChange={setActiveYear}
            />
          </div>

          {/* 본문 박스 */}
          <div
            className={cn(
              "rounded-[12px] rounded-tl-none border border-gray-200 bg-white",
              "px-10 pt-10 pb-6",
              "shadow-[0_1px_10px_rgba(0,0,0,0.04)]"
            )}
          >
            {/* 로딩/에러 */}
            {loading && (
              <div className="py-20 text-center text-gray-500 text-sm">
                계산 결과 불러오는 중...
              </div>
            )}

            {!loading && errorMsg && (
              <div className="py-16 text-center">
                <div className="text-red-500 text-sm font-medium">{errorMsg}</div>
                <div className="mt-2 text-gray-400 text-xs">
                  caseId / API baseURL / CORS / 로그인 여부를 확인해주십시오.
                </div>
              </div>
            )}

            {!loading && !errorMsg && activeYear !== null && plans.length === 0 && (
              <div className="py-20 text-center text-gray-500 text-sm">
                선택한 연도에 표시할 플랜이 없습니다.
              </div>
            )}

            {/* 카드들 */}
            {!loading && !errorMsg && plans.length > 0 && (
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
            )}
          </div>

          {/* 선택 완료 버튼 */}
          <div className="mt-8 mb-8 flex justify-end">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!isAllYearsPicked || loading || !!errorMsg}
              className={cn(
                "h-[41px] w-[144px] rounded-[7px] border px-4 text-sm font-medium transition",
                !loading && !errorMsg && isAllYearsPicked
                  ? "border-[#64A5FF] text-[#64A5FF] hover:bg-blue-50"
                  : "cursor-not-allowed border-gray-200 text-gray-300"
              )}
            >
              선택 완료
            </button>
          </div>
        </div>

        {/* 결과 모달 */}
        <RefundOutcomeModal
          isOpen={isOutcomeOpen}
          step={outcomeStep}
          onClose={() => setIsOutcomeOpen(false)}
          refundAmount={totalRefund}
          pdfFile={null}
          onConfirm={() => setOutcomeStep("completed")}
          onDownloadPdf={() => console.log("PDF 출력하기")}
          onSelectCustomer={() => {
            setIsOutcomeOpen(false);
            navigate("/");
          }}
        />
      </div>
    </div>
  );
}