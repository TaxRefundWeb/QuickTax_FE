import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Option = { value: string; label: string };

type RadioDropdownProps = {
  label: string;
  placeholder?: string;
  value: string | null;
  onChange: (next: string) => void;
  options: Option[];
  buttonWidthClass?: string; // ex) "w-[104px]" or "w-full"
};

function RadioDropdown({
  label,
  placeholder = "선택",
  value,
  onChange,
  options,
  buttonWidthClass = "w-full",
}: RadioDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const display = useMemo(() => {
    if (!value) return placeholder;
    const found = options.find((o) => o.value === value);
    return found?.label ?? value;
  }, [value, options, placeholder]);

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-2 block text-base text-gray-600">{label}</label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "h-10",
          buttonWidthClass,
          "rounded-md border bg-white px-3 text-sm outline-none",
          open ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200",
          value ? "text-gray-900" : "text-gray-400",
        ].join(" ")}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="truncate">{display}</span>

          {/* chevron */}
          <svg
            className={[
              "h-4 w-4 text-gray-400 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div className="absolute z-20 mt-2 w-[180px] rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
          {options.map((opt) => {
            const selected = opt.value === value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  selected ? "bg-blue-50" : "hover:bg-gray-50",
                ].join(" ")}
              >
                {/* 라디오 */}
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    selected ? "border-blue-500" : "border-gray-300",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {selected && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </span>

                <span
                  className={[
                    selected ? "font-medium text-blue-600" : "text-gray-700",
                  ].join(" ")}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-[132px] rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300"
    />
  );
}

export default function ExistingCustomerPage() {
  const navigate = useNavigate();

  // 드롭다운 값
  const [reduction, setReduction] = useState<string | null>(null); // 감면처리 여부 (여/부)
  const [spouse, setSpouse] = useState<string | null>(null); // 배우자 유무 (유/무)
  const [child, setChild] = useState<string | null>(null); // 자녀 유무 (유/무)

  // 입력값
  const [year, setYear] = useState("");
  const [bizNo, setBizNo] = useState("");

  // 날짜(감면기간 / 근무기간)
  const [reduceStart, setReduceStart] = useState("");
  const [reduceEnd, setReduceEnd] = useState("");
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");

  // 모두 입력됐는지
  const isValid = Boolean(
    reduction &&
      spouse &&
      child &&
      year.trim() &&
      bizNo.trim() &&
      reduceStart &&
      reduceEnd &&
      workStart &&
      workEnd
  );

  // ✅ 입력완료 클릭 시 ConfirmExisting으로 이동 + state로 폼 전달
  const handleSubmit = () => {
    if (!isValid) return;

    navigate("/step1/existing/confirm", {
      state: {
        form: {
          reduction,
          reduceStart,
          reduceEnd,
          year,
          workStart,
          workEnd,
          bizNo,
          spouse,
          child,
        },
      },
    });
  };

  return (
    <div className="w-screen flex justify-center">
      <div className="w-[540px]">
        <div className="-mt-[120px]">
          <h1 className="mb-4 text-[24px] font-bold text-gray-900">
            경정청구 신청
          </h1>
          <p className="mt-2 mb-[72px] text-[16px] text-gray-500">
            업무에 필요한 정보를 입력해주세요
          </p>
        </div>

        <form className="space-y-5">
          {/* 감면처리 여부 / 감면 기간 */}
          <div className="grid grid-cols-2 gap-6">
            <RadioDropdown
              label="감면처리 여부"
              value={reduction}
              onChange={setReduction}
              buttonWidthClass="w-[104px]"
              options={[
                { value: "yes", label: "여" },
                { value: "no", label: "부" },
              ]}
            />

            <div className="justify-self-end">
              <label className="mb-2 block text-base text-gray-600">
                감면 기간
              </label>
              <div className="grid grid-cols-[auto_auto_auto] items-center gap-2">
                <DateInput value={reduceStart} onChange={setReduceStart} />
                <span className="text-gray-300">—</span>
                <DateInput value={reduceEnd} onChange={setReduceEnd} />
              </div>
            </div>
          </div>

          {/* 원천징수 영수증 년도 / 근무 기간 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">
                원천징수 영수증 년도
              </label>
              <input
                type="text"
                placeholder="예) 2024"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-10 w-[160px] rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300"
              />
            </div>

            <div className="justify-self-end">
              <label className="mb-2 block text-base text-gray-600">
                근무 기간
              </label>
              <div className="grid grid-cols-[auto_auto_auto] items-center gap-2">
                <DateInput value={workStart} onChange={setWorkStart} />
                <span className="text-gray-300">—</span>
                <DateInput value={workEnd} onChange={setWorkEnd} />
              </div>
            </div>
          </div>

          {/* 사업자 등록번호 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">
              사업자 등록번호
            </label>
            <input
              type="text"
              value={bizNo}
              onChange={(e) => setBizNo(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300"
            />
          </div>

          {/* 배우자 유무 */}
          <RadioDropdown
            label="배우자 유무"
            value={spouse}
            onChange={setSpouse}
            buttonWidthClass="w-[104px]"
            options={[
              { value: "yes", label: "유" },
              { value: "no", label: "무" },
            ]}
          />

          {/* 자녀 유무 */}
          <RadioDropdown
            label="자녀 유무"
            value={child}
            onChange={setChild}
            buttonWidthClass="w-[104px]"
            options={[
              { value: "yes", label: "유" },
              { value: "no", label: "무" },
            ]}
          />

          {/* 버튼 */}
          <div className="flex justify-end">
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
        </form>
      </div>
    </div>
  );
}
