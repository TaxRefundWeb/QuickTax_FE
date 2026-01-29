import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const selectedLabel = value || "";

  return (
    <div ref={rootRef} className="relative w-[269px] h-[64px]">
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
        <span className={selectedLabel ? "text-gray-700" : "text-gray-300"}>
          {selectedLabel || "선택"}
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
                  role="option"
                  aria-selected={checked}
                >
                  <span
                    className={[
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      checked ? "border-[#2563EB]" : "border-gray-300",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {checked && (
                      <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                    )}
                  </span>

                  <span className={checked ? "text-[#2563EB]" : "text-gray-600"}>
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

export default function SelectPeriod() {
  const navigate = useNavigate();

  const [startYear, setStartYear] = useState<Year>("");
  const [endYear, setEndYear] = useState<Year>("");

  const isValid = useMemo(() => {
    if (!startYear || !endYear) return false;
    return Number(startYear) <= Number(endYear);
  }, [startYear, endYear]);

  const handleSubmit = () => {
    if (!isValid) return;
    navigate("/step1/existing", { state: { startYear, endYear } });
  };

  return (
    // ✅ 부모(StepLayout)에 중앙정렬이 없어도 여기서 중앙정렬 책임짐
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

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="mb-2 block text-[20px] font-medium text-[#595959] leading-normal">
                경정청구 기간
              </label>

              <div className="grid grid-cols-[269px_auto_269px_181px] items-center gap-6">
                <YearRadioDropdown
                  value={startYear}
                  onChange={setStartYear}
                  options={YEAR_OPTIONS}
                />

                <div className="flex justify-center">
                  <span className="text-[20px] text-gray-300">—</span>
                </div>

                <YearRadioDropdown
                  value={endYear}
                  onChange={setEndYear}
                  options={YEAR_OPTIONS}
                />

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className={[
                    "h-[48px] w-[181px] rounded-lg border text-base font-medium shadow-sm transition-colors bg-white",
                    isValid
                      ? "border-[#64A5FF] text-[#64A5FF] hover:bg-[#64A5FF]/10"
                      : "border-gray-200 text-gray-400 cursor-not-allowed",
                  ].join(" ")}
                >
                  입력완료
                </button>
              </div>

              <p
                className={[
                  "mt-2 min-h-[20px] text-[13px]",
                  !isValid && startYear && endYear
                    ? "text-red-500"
                    : "text-transparent",
                ].join(" ")}
              >
                시작 연도는 종료 연도보다 작아야 합니다.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
