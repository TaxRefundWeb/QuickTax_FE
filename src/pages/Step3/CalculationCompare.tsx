// src/pages/Step3/CalculationCompare.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import CalculationCard from "../../components/card/CalculationCard";
import RefundOutcomeModal, {
  type RefundOutcomeStep,
} from "../../components/modal/RefundOutcomeModal";

import type { RefundPlan } from "../../data/customersDummy";
import type {
  RefundResultByYear,
  Scenario,
  SubmitResultRequest,
} from "../../lib/api/result";

type Props = {
  year?: number; // 이제 사실상 안 씀(호환용)
};

type NavState = {
  year?: string | number; // OCR에서 넘어오는 year
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

// ✅ 더미 계산 결과 (API 연결 전 임시)
const MOCK_REFUND_RESULTS: RefundResultByYear[] = [
  {
    case_year: 2022,
    scenarios: [
      {
        scenario_code: "S2022_A",
        tax_difference_amount: 120000,
        determined_tax_amount: 1800000,
        tax_base_amount: 24000000,
        calculated_tax: 1950000,
        earned_income_amount: 32000000,
        refund_amount: 340000,
        scenario_text: "기본 공제 + 일부 추가 공제 적용",
      },
      {
        scenario_code: "S2022_B",
        tax_difference_amount: 220000,
        determined_tax_amount: 1800000,
        tax_base_amount: 24000000,
        calculated_tax: 1850000,
        earned_income_amount: 32000000,
        refund_amount: 520000,
        scenario_text: "인적공제 확대 + 세액공제 최적화",
      },
      {
        scenario_code: "S2022_C",
        tax_difference_amount: 90000,
        determined_tax_amount: 1800000,
        tax_base_amount: 24000000,
        calculated_tax: 2000000,
        earned_income_amount: 32000000,
        refund_amount: 260000,
        scenario_text: "보수적(최소) 적용",
      },
    ],
  },
  {
    case_year: 2023,
    scenarios: [
      {
        scenario_code: "S2023_A",
        tax_difference_amount: 150000,
        determined_tax_amount: 2100000,
        tax_base_amount: 26000000,
        calculated_tax: 2250000,
        earned_income_amount: 35000000,
        refund_amount: 410000,
        scenario_text: "표준 공제 + 세액공제 일부 반영",
      },
      {
        scenario_code: "S2023_B",
        tax_difference_amount: 260000,
        determined_tax_amount: 2100000,
        tax_base_amount: 26000000,
        calculated_tax: 2100000,
        earned_income_amount: 35000000,
        refund_amount: 680000,
        scenario_text: "공제 최적화(환급 최대)",
      },
      {
        scenario_code: "S2023_C",
        tax_difference_amount: 100000,
        determined_tax_amount: 2100000,
        tax_base_amount: 26000000,
        calculated_tax: 2300000,
        earned_income_amount: 35000000,
        refund_amount: 300000,
        scenario_text: "보수적 계산",
      },
    ],
  },
];

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
  const location = useLocation();
  const { caseId: caseIdParam } = useParams<{ caseId: string }>();

  // URL param -> number caseId (한 번만 계산해서 재사용)
  const caseId = useMemo(() => {
    if (!caseIdParam) return null;
    const n = Number(caseIdParam);
    return Number.isFinite(n) ? n : null;
  }, [caseIdParam]);

  // OCR에서 넘어온 year(state) + 새로고침 대비 sessionStorage fallback
  const navState = (location.state as NavState | null) ?? null;

  const yearFromNav = useMemo(() => {
    const v = navState?.year ?? sessionStorage.getItem("activeYear") ?? null;
    if (v === null || v === undefined) return null;
    const n = Number(String(v));
    return Number.isFinite(n) ? n : null;
  }, [navState]);

  const [refundResults, setRefundResults] = useState<RefundResultByYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // POST 진행 중 상태(더미)
  const [submitting, setSubmitting] = useState(false);

  // ✅ 더미로 대체: 계산 결과 조회(임시)
  useEffect(() => {
    if (!caseIdParam) {
      setErrorMsg("caseId가 없습니다. URL을 확인해 주세요. (/compare/:caseId)");
      setRefundResults([]);
      return;
    }

    if (caseId === null) {
      setErrorMsg("caseId가 숫자가 아닙니다. 라우팅/파라미터를 확인해 주세요.");
      setRefundResults([]);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // ✅ API 대신 약간의 딜레이 후 더미 주입 (로딩 UI 확인 가능)
        await new Promise((r) => setTimeout(r, 350));

        if (!alive) return;

        const list = MOCK_REFUND_RESULTS;

        if (!Array.isArray(list) || list.length === 0) {
          setErrorMsg("표시할 계산 결과가 없습니다.");
          setRefundResults([]);
          return;
        }

        setRefundResults(list);
      } catch (e) {
        console.error(e);
        setErrorMsg("더미 계산 결과를 불러오지 못했습니다.");
        setRefundResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [caseIdParam, caseId]);

  const years = useMemo(() => {
    return [...refundResults]
      .map((r) => r.case_year)
      .filter((y) => Number.isFinite(y))
      .sort((a, b) => a - b);
  }, [refundResults]);

  // plansByYear
  const plansByYear = useMemo(() => {
    const map = new Map<number, RefundPlan[]>();

    for (const rr of refundResults) {
      const plans = (rr.scenarios ?? []).map((s, idx) => scenarioToPlan(s, idx));
      map.set(rr.case_year, plans);
    }

    return map;
  }, [refundResults]);

  // 연도별 bestPlanId 계산
  const bestPlanIdByYear = useMemo(() => {
    const m = new Map<number, string | null>();

    for (const y of years) {
      const list = plansByYear.get(y) ?? [];
      if (list.length === 0) {
        m.set(y, null);
        continue;
      }
      const best = list.reduce((best, cur) =>
        cur.refundExpected > best.refundExpected ? cur : best
      );
      m.set(y, best.id);
    }

    return m;
  }, [years, plansByYear]);

  // activeYear 초기값
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    if (activeYear !== null) return;
    if (!years.length) return;

    // 우선순위: (1) props.year -> (2) nav/state year -> (3) 첫 연도
    const initial =
      (typeof year === "number" ? year : null) ?? yearFromNav ?? years[0];

    const safe = years.includes(initial) ? initial : years[0];
    setActiveYear(safe);
  }, [years, year, yearFromNav, activeYear]);

  // activeYear 저장(새로고침 대비)
  useEffect(() => {
    if (activeYear === null) return;
    sessionStorage.setItem("activeYear", String(activeYear));
  }, [activeYear]);

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

  // 현재 연도의 best(배지용)
  const bestPlanId = useMemo(() => {
    if (activeYear === null) return null;
    return bestPlanIdByYear.get(activeYear) ?? null;
  }, [activeYear, bestPlanIdByYear]);

  // years 생기면: 각 연도별 best를 기본 선택으로 채움
  useEffect(() => {
    if (!years.length) return;

    setPickedPlanIdByYear((prev) => {
      let changed = false;
      const next: Record<number, string | null> = { ...prev };

      for (const y of years) {
        if (next[y]) continue; // 이미 사용자가 고른게 있으면 유지
        const bestId = bestPlanIdByYear.get(y) ?? null;
        if (bestId) {
          next[y] = bestId;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [years, bestPlanIdByYear]);

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

  // POST body 만들기 (더미에서도 payload는 유지)
  const submitPayload = useMemo<SubmitResultRequest>(() => {
    return {
      scenarios: years
        .map((y) => {
          const scenarioCode = pickedPlanIdByYear[y];
          if (!scenarioCode) return null;
          return { case_year: y, scenario_code: scenarioCode };
        })
        .filter(Boolean) as Array<{ case_year: number; scenario_code: string }>,
    };
  }, [years, pickedPlanIdByYear]);

  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const [outcomeStep, setOutcomeStep] = useState<RefundOutcomeStep>("review");

  // ✅ 선택 완료: API 대신 모달만 띄우기(임시)
  const onSubmit = async () => {
    if (!isAllYearsPicked) return;

    if (caseId === null) {
      alert("caseId가 올바르지 않습니다.");
      return;
    }

    if (!submitPayload.scenarios.length) {
      alert("선택된 플랜이 없습니다.");
      return;
    }

    try {
      setSubmitting(true);

      // ✅ 여기서 payload만 확인 (추후 postCalculationResult로 교체)
      console.log("[MOCK SUBMIT]", { caseId, submitPayload });

      await new Promise((r) => setTimeout(r, 350));

      setOutcomeStep("review");
      setIsOutcomeOpen(true);
    } catch (e) {
      console.error(e);
      alert("저장(더미) 중 오류가 발생했습니다. 콘솔을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
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
                  caseId / 라우팅을 확인해주십시오.
                </div>
              </div>
            )}

            {!loading &&
              !errorMsg &&
              activeYear !== null &&
              plans.length === 0 && (
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
              disabled={!isAllYearsPicked || loading || !!errorMsg || submitting}
              className={cn(
                "h-[41px] w-[144px] rounded-[7px] border px-4 text-sm font-medium transition",
                !loading && !errorMsg && isAllYearsPicked && !submitting
                  ? "border-[#64A5FF] text-[#64A5FF] hover:bg-blue-50"
                  : "cursor-not-allowed border-gray-200 text-gray-300"
              )}
            >
              {submitting ? "저장 중..." : "선택 완료"}
            </button>
          </div>
        </div>

        {/* 결과 모달 */}
        <RefundOutcomeModal
          isOpen={isOutcomeOpen}
          step={outcomeStep}
          onClose={() => setIsOutcomeOpen(false)}
          caseId={caseId}
          refundAmount={totalRefund}
          pdfFile={null}
          onConfirm={() => setOutcomeStep("completed")}
          onDownloadPdf={() => console.log("PDF 출력하기")}
          onSelectCustomer={() => {
            setIsOutcomeOpen(false);
            navigate("/", { replace: true });
          }}
        />
      </div>
    </div>
  );
}