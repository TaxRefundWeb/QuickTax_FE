import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { refundSelection } from "../../lib/api/refund";

type Year = string;

const YEAR_OPTIONS: Year[] = [
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
];

function YearRadioDropdown({
  value,
  onChange,
  options,
}: {
  value: Year;
  onChange: (v: Year) => void;
  options: Year[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative h-[64px] w-[200px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-[64px] w-full items-center justify-between",
          "rounded-[4px] border bg-[#FAFAFA] px-4",
          "text-left text-[20px] text-gray-700 outline-none",
          open ? "border-[#64A5FF]" : "border-gray-200",
        ].join(" ")}
      >
        <span className={value ? "text-gray-700" : "text-gray-300"}>
          {value || "선택"}
        </span>

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className={
            open ? "rotate-180 transition-transform" : "transition-transform"
          }
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="#BDBDBD"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[72px] z-20 w-full rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[220px] overflow-auto py-2">
            {options.map((y) => {
              const checked = value === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onChange(y);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center gap-5 px-4 py-3 text-left",
                    checked ? "bg-[#EAF2FF]" : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      checked ? "border-[#2563EB]" : "border-gray-300",
                    ].join(" ")}
                  >
                    {checked && (
                      <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                    )}
                  </span>

                  <span
                    className={checked ? "text-[#2563EB]" : "text-gray-600"}
                  >
                    {y}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type PeriodNavState = {
  customerId?: number | string;
};

export default function SelectPeriod() {
  const navigate = useNavigate();
  const location = useLocation();

  // customerId 가져오기 (state + sessionStorage)
  const rawCustomerId =
    (location.state as PeriodNavState | null)?.customerId ??
    sessionStorage.getItem("customerId") ??
    null;

  console.log("[SelectPeriod] location.state =", location.state);
  console.log(
    "[SelectPeriod] session customerId =",
    sessionStorage.getItem("customerId")
  );
  console.log("[SelectPeriod] rawCustomerId =", rawCustomerId);

  // 매우 안전한 파싱
  const customerId = (() => {
    if (rawCustomerId === null || rawCustomerId === undefined) return null;

    const s = String(rawCustomerId).trim();
    if (!s || s === "null" || s === "undefined" || s === "NaN") return null;

    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  })();

  console.log("[SelectPeriod] parsed customerId =", customerId);

  const [startYear, setStartYear] = useState<Year>("");
  const [endYear, setEndYear] = useState<Year>("");

  const [claimDate, setClaimDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [submitting, setSubmitting] = useState(false);

  // ✅ customerId 검증 + 리다이렉트
  useEffect(() => {
    console.log("[SelectPeriod] effect customerId =", customerId);

    if (customerId !== null) {
      sessionStorage.setItem("customerId", String(customerId));
      return;
    }

    sessionStorage.removeItem("customerId");
    console.log("[SelectPeriod] redirect to / (invalid customerId)");
    navigate("/", { replace: true });
  }, [customerId, navigate]);

  const isValid = useMemo(() => {
    if (!startYear || !endYear || !claimDate) return false;
    return Number(startYear) <= Number(endYear);
  }, [startYear, endYear, claimDate]);

  const handleSubmit = async () => {
    if (!isValid || customerId === null) return;

    try {
      setSubmitting(true);

      const res = await refundSelection({
        claim_from: `${startYear}-01-01`,
        claim_to: `${endYear}-12-31`,
      });

      navigate("/step1/existing", {
        state: {
          customerId,
          startYear,
          endYear,
          claimDate,
          refundSelectionResult: res?.result ?? null,
        },
      });
    } catch (e) {
      console.error(e);
      alert("기간 선택 요청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const showYearError =
    !!startYear && !!endYear && Number(startYear) > Number(endYear);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[920px]">
        <div className="w-[580px]">
          <h1 className="mb-4 text-[24px] font-bold text-gray-900">
            경정청구 신청
          </h1>

          <p className="mb-[120px] text-[16px] text-gray-500">
            경정청구를 신청할 기간을 선택해 주세요 <br />
            기간을 선택하면 상세 입력창이 나타납니다.
          </p>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-[200px_28px_200px_1fr_181px_181px] items-end gap-3">
              <label className="text-[20px] text-[#595959]">
                경정청구 기간
              </label>
              <div />
              <div />
              <div />
              <label className="text-[20px] text-[#595959]">청구 일자</label>
              <div />
            </div>

            <div className="mt-2 grid grid-cols-[200px_28px_200px_1fr_181px_181px] items-center gap-3">
              <YearRadioDropdown
                value={startYear}
                onChange={setStartYear}
                options={YEAR_OPTIONS}
              />

              <div className="flex h-[64px] items-center justify-center">
                <span className="text-[20px] text-gray-300">—</span>
              </div>

              <YearRadioDropdown
                value={endYear}
                onChange={setEndYear}
                options={YEAR_OPTIONS}
              />

              <div />

              <input
                type="date"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                className={[
                  "h-[64px] w-[181px]",
                  "rounded-[4px] border bg-[#FAFAFA] px-4",
                  "text-[18px] text-gray-700 outline-none",
                  "border-gray-200 focus:border-[#64A5FF]",
                ].join(" ")}
              />

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className={[
                  "h-[48px] w-[181px] rounded-lg border text-base font-medium shadow-sm transition-colors bg-white",
                  isValid && !submitting
                    ? "border-[#64A5FF] text-[#64A5FF] hover:bg-[#64A5FF]/10"
                    : "border-gray-200 text-gray-400 cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "처리 중..." : "입력완료"}
              </button>
            </div>

            <p
              className={[
                "mt-2 min-h-[20px] text-[13px]",
                showYearError ? "text-red-500" : "text-transparent",
              ].join(" ")}
            >
              시작 연도는 종료 연도보다 작아야 합니다.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
