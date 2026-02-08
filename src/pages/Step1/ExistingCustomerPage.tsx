import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import FileTab, { type FileTabItem } from "../../components/filetab/FileTab";
import { createRefundClaim } from "../../lib/api/refundClaims";

type Option = { value: string; label: string };

type PeriodState = {
  startYear?: string;
  endYear?: string;
  customerId?: number | string;
};

type RadioDropdownProps = {
  label: string;
  placeholder?: string;
  value: string | null;
  onChange: (next: string) => void;
  options: Option[];
  buttonWidthClass?: string;
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
      {label !== "" && (
        <label className="mb-2 block text-[16px] text-gray-500">{label}</label>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "h-[48px]",
          buttonWidthClass,
          "rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none",
          open ? "border-blue-500 ring-2 ring-blue-100" : "",
          value ? "text-gray-900" : "text-gray-400",
        ].join(" ")}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="truncate">{display}</span>
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
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    selected ? "border-blue-500" : "border-gray-300",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                </span>

                <span
                  className={selected ? "font-medium text-blue-600" : "text-gray-700"}
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

function yearsInRange(start: string, end: string): number[] {
  const s = Number(start);
  const e = Number(end);
  if (!start || !end || Number.isNaN(s) || Number.isNaN(e) || s > e) return [];
  const arr: number[] = [];
  for (let y = s; y <= e; y += 1) arr.push(y);
  return arr;
}

/** 근무처(배열) */
type WorkPlace = {
  corpName: string;
  workStart: string; // YYYY-MM-DD
  workEnd: string; // YYYY-MM-DD
  sme: string | null; // yes/no
  bizNo: string;
};
const emptyWorkPlace = (): WorkPlace => ({
  corpName: "",
  workStart: "",
  workEnd: "",
  sme: null,
  bizNo: "",
});

/** 자녀(배열) */
type ChildInfo = {
  name: string;
  rrn: string;
};
const emptyChild = (): ChildInfo => ({ name: "", rrn: "" });

/** 연도별 폼 */
type YearForm = {
  workplaces: WorkPlace[];

  // ✅ 감면 여부만 받기 (yes/no)
  reductionYn: string | null; // yes/no

  // 인적 공제
  spouse: string | null; // yes/no
  spouseName: string;
  spouseRrn: string;

  child: string | null; // yes/no
  children: ChildInfo[];
};

const emptyYearForm = (): YearForm => ({
  workplaces: [emptyWorkPlace()],

  reductionYn: null,

  spouse: null,
  spouseName: "",
  spouseRrn: "",

  child: null,
  children: [emptyChild()],
});

function isYearFormValid(f: YearForm) {
  const allWorkplacesValid =
    f.workplaces.length > 0 &&
    f.workplaces.every(
      (w) =>
        w.corpName.trim() &&
        w.bizNo.trim() &&
        w.workStart &&
        w.workEnd &&
        w.sme
    );

  const reductionValid = f.reductionYn === "yes" || f.reductionYn === "no";

  const spouseChoiceValid = f.spouse === "yes" || f.spouse === "no";
  const childChoiceValid = f.child === "yes" || f.child === "no";

  const spouseDetailValid =
    f.spouse !== "yes" ||
    (f.spouseName.trim().length > 0 && f.spouseRrn.trim().length > 0);

  const childrenDetailValid =
    f.child !== "yes" ||
    (f.children.length > 0 && f.children.every((c) => c.name.trim() && c.rrn.trim()));

  return Boolean(
    allWorkplacesValid &&
      reductionValid &&
      spouseChoiceValid &&
      childChoiceValid &&
      spouseDetailValid &&
      childrenDetailValid
  );
}

const normalizeBizNo = (s: string) => s.replaceAll("-", "").trim();
const normalizeRrn = (s: string) => s.replaceAll("-", "").trim();
const toBool = (v: string | null) => v === "yes";

/** ✅ 새 Swagger 구조 타입 */
type RefundClaimV2Payload = {
  cases: Array<{
    case_year: number;
    reduction_yn: boolean;
    spouse_yn: boolean;
    child_yn: boolean;
    companies: Array<{
      business_number: string;
      case_work_start: string;
      case_work_end: string;
      small_business_yn: boolean;
    }>;
    spouse: {
      spouse_name: string;
      spouse_rrn: string;
    };
    children: Array<{
      child_name: string;
      child_rrn: string;
    }>;
  }>;
};

function buildRefundClaimPayloadV2(args: {
  years: number[];
  formsByYear: Record<string, YearForm>;
}): RefundClaimV2Payload {
  const { years, formsByYear } = args;

  return {
    cases: years.map((year) => {
      const f = formsByYear[String(year)] ?? emptyYearForm();

      return {
        case_year: year,

        // ✅ 추가: 감면 여부 (boolean)
        reduction_yn: toBool(f.reductionYn),

        spouse_yn: toBool(f.spouse),
        child_yn: toBool(f.child),

        companies: f.workplaces.map((w) => ({
          business_number: normalizeBizNo(w.bizNo),
          case_work_start: w.workStart,
          case_work_end: w.workEnd,
          small_business_yn: toBool(w.sme),
        })),

        spouse:
          f.spouse === "yes"
            ? {
                spouse_name: f.spouseName.trim(),
                spouse_rrn: normalizeRrn(f.spouseRrn),
              }
            : {
                spouse_name: "",
                spouse_rrn: "",
              },

        children:
          f.child === "yes"
            ? f.children.map((c) => ({
                child_name: c.name.trim(),
                child_rrn: normalizeRrn(c.rrn),
              }))
            : [],
      };
    }),
  };
}

export default function ExistingCustomerPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const period = (location.state as PeriodState | null) ?? null;
  const startYear = period?.startYear ?? "";
  const endYear = period?.endYear ?? "";

  // 라우팅 customerId (payload에는 안 들어가지만 흐름 유지를 위해 둠)
  const rawCustomerId = period?.customerId ?? null;
  const customerId = rawCustomerId === null ? null : Number(rawCustomerId);

  useEffect(() => {
    if (!startYear || !endYear) {
      navigate("/step1/period", { replace: true });
      return;
    }
    if (!Number.isFinite(customerId)) {
      alert("고객 ID가 없습니다. 고객 선택부터 다시 진행해주세요.");
      navigate("/", { replace: true });
      return;
    }
  }, [startYear, endYear, customerId, navigate]);

  const yearList = useMemo(() => yearsInRange(startYear, endYear), [startYear, endYear]);

  const [openYears, setOpenYears] = useState<number[]>([]);
  const [activeKey, setActiveKey] = useState<string>("");

  const [formsByYear, setFormsByYear] = useState<Record<string, YearForm>>({});

  useEffect(() => {
    if (yearList.length === 0) return;

    setOpenYears(yearList);
    const first = String(yearList[0]);
    setActiveKey(first);

    setFormsByYear((prev) => {
      const next = { ...prev };
      yearList.forEach((y) => {
        const k = String(y);
        if (!next[k]) next[k] = emptyYearForm();
      });
      return next;
    });
  }, [yearList]);

  const tabItems: FileTabItem[] = useMemo(
    () =>
      openYears.map((y) => ({
        key: String(y),
        label: `${String(y).slice(2)}년`,
      })),
    [openYears]
  );

  const currentForm = formsByYear[activeKey] ?? emptyYearForm();

  const updateCurrent = (patch: Partial<YearForm>) => {
    setFormsByYear((prev) => ({
      ...prev,
      [activeKey]: { ...(prev[activeKey] ?? emptyYearForm()), ...patch },
    }));
  };

  const updateWorkPlace = (idx: number, patch: Partial<WorkPlace>) => {
    const next = currentForm.workplaces.map((w, i) => (i === idx ? { ...w, ...patch } : w));
    updateCurrent({ workplaces: next });
  };

  const addWorkPlace = () => {
    updateCurrent({ workplaces: [...currentForm.workplaces, emptyWorkPlace()] });
  };

  const removeWorkPlace = (idx: number) => {
    if (idx === 0) return;
    updateCurrent({ workplaces: currentForm.workplaces.filter((_, i) => i !== idx) });
  };

  const setReductionYn = (v: string) => updateCurrent({ reductionYn: v });

  const setSpouse = (v: string) => {
    if (v === "no") {
      updateCurrent({ spouse: v, spouseName: "", spouseRrn: "" });
      return;
    }
    updateCurrent({ spouse: v });
  };

  const setChild = (v: string) => {
    if (v === "no") {
      updateCurrent({ child: v, children: [emptyChild()] });
      return;
    }
    updateCurrent({ child: v });
  };

  const updateChild = (idx: number, patch: Partial<ChildInfo>) => {
    const next = currentForm.children.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    updateCurrent({ children: next });
  };

  const addChild = () => {
    updateCurrent({ children: [...currentForm.children, emptyChild()] });
  };

  const allValid = useMemo(() => {
    if (openYears.length === 0) return false;
    return openYears.every((y) => {
      const f = formsByYear[String(y)];
      return f ? isYearFormValid(f) : false;
    });
  }, [openYears, formsByYear]);

  const handleFinalSubmit = async () => {
    if (!allValid) return;
    if (!Number.isFinite(customerId)) return;

    try {
      const payload = buildRefundClaimPayloadV2({
        years: openYears,
        formsByYear,
      });

      // ✅ createRefundClaim의 타입이 아직 구버전이면, api 쪽 타입도 V2로 업데이트해줘야 함.
      const res = await createRefundClaim(payload as any);

      navigate("/step2/ocr-compare", {
        state: {
          period: { startYear, endYear, customerId },
          years: openYears.map(String),
          formsByYear,
          refundClaimResult: res,
        },
      });
    } catch (e) {
      console.error(e);
      alert("서버 요청 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-[944px] pb-8">
        <h1 className="mb-2 text-[24px] font-bold text-gray-900">경정청구 신청</h1>
        <p className="mb-6 text-[14px] text-gray-500">
          {startYear && endYear
            ? `선택하신 ${startYear}~${endYear}년에 대한 상세 정보를 아래에 입력해 주세요.`
            : "업무에 필요한 정보를 입력해주세요"}
        </p>

        <FileTab
          items={tabItems}
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          onClose={
            openYears.length <= 1
              ? undefined
              : (key) => {
                  setOpenYears((prev) => prev.filter((y) => String(y) !== key));
                  setFormsByYear((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });

                  setActiveKey((prevKey) => {
                    if (prevKey !== key) return prevKey;
                    const remaining = openYears
                      .filter((y) => String(y) !== key)
                      .map(String);
                    return remaining[0] ?? "";
                  });
                }
          }
        />

        {/* 탭 아래 큰 박스 */}
        <div className="w-full border border-gray-200 bg-white rounded-tr-[12px] rounded-br-[12px] rounded-bl-[12px] rounded-tl-none">
          <div className="max-h-[760px] overflow-auto">
            <div className="mx-auto w-[850px] pl-10 pr-12 py-10 justify-center">
              {/* 근무지 정보 */}
              <section>
                <h2 className="mb-6 text-[20px] font-semibold text-gray-800">근무지 정보</h2>

                <div className="space-y-4">
                  {currentForm.workplaces.map((w, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-[8px] border border-gray-200 bg-white p-8"
                    >
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => removeWorkPlace(idx)}
                          aria-label={`근무처 ${idx + 1} 삭제`}
                          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}

                      <div className="grid grid-cols-[80px_1fr] gap-6">
                        <div className="flex items-center justify-start pl-1 -ml-2 border-r border-gray-100 text-[16px] font-medium text-gray-600">
                          {`근무처 ${idx + 1}`}
                        </div>

                        <div className="grid grid-cols-2 gap-y-6">
                          <div>
                            <label className="mb-2 block text-[16px] text-gray-500">
                              법인명
                            </label>
                            <input
                              value={w.corpName}
                              onChange={(e) => updateWorkPlace(idx, { corpName: e.target.value })}
                              className="h-[48px] w-[177px] rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-gray-300"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-[16px] text-gray-500">
                              근무 기간
                            </label>
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                              <input
                                type="date"
                                value={w.workStart}
                                onChange={(e) =>
                                  updateWorkPlace(idx, { workStart: e.target.value })
                                }
                                className="h-[48px] w-[132px] rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-gray-300"
                              />
                              <span className="text-gray-300">—</span>
                              <input
                                type="date"
                                value={w.workEnd}
                                onChange={(e) =>
                                  updateWorkPlace(idx, { workEnd: e.target.value })
                                }
                                className="h-[48px] w-full rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-gray-300"
                              />
                            </div>
                          </div>

                          <div className="max-w-[116px]">
                            <RadioDropdown
                              label="중소기업 여부"
                              value={w.sme}
                              onChange={(v) => updateWorkPlace(idx, { sme: v })}
                              options={[
                                { value: "yes", label: "여" },
                                { value: "no", label: "부" },
                              ]}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-[16px] text-gray-500">
                              사업자 등록번호
                            </label>
                            <input
                              value={w.bizNo}
                              onChange={(e) => updateWorkPlace(idx, { bizNo: e.target.value })}
                              className="h-[48px] w-full rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addWorkPlace}
                  className="mt-4 inline-flex h-[34px] items-center rounded-[6px] border border-gray-200 bg-white px-4 text-[12px] text-gray-500 hover:bg-gray-50"
                >
                  + 근무처 추가
                </button>
              </section>

              <div className="h-12" />

              {/* 감면 여부 */}
              <section>
                <h2 className="mb-6 text-[20px] font-semibold text-gray-800">서류 정보</h2>

                <div className="w-[100px]">
                  <RadioDropdown
                    label="감면 여부"
                    value={currentForm.reductionYn}
                    onChange={setReductionYn}
                    options={[
                      { value: "yes", label: "유" },
                      { value: "no", label: "무" },
                    ]}
                  />
                </div>
              </section>

              <div className="h-12" />

              {/* 인적 공제 정보 */}
              <section>
                <h2 className="mb-6 text-[20px] font-semibold text-gray-800">
                  인적 공제 정보
                </h2>

                <div className="space-y-8">
                  <div className="w-[100px]">
                    <RadioDropdown
                      label="배우자 유무"
                      value={currentForm.spouse}
                      onChange={setSpouse}
                      options={[
                        { value: "yes", label: "유" },
                        { value: "no", label: "무" },
                      ]}
                    />
                  </div>

                  {currentForm.spouse === "yes" && (
                    <div className="grid grid-cols-2 gap-x-10 gap-y-6 max-w-[520px]">
                      <div>
                        <label className="mb-2 block text-[12px] text-gray-500">
                          배우자 이름
                        </label>
                        <input
                          value={currentForm.spouseName}
                          onChange={(e) => updateCurrent({ spouseName: e.target.value })}
                          className="h-[48px] w-[100px] rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[12px] text-gray-500">
                          배우자 주민등록번호
                        </label>
                        <input
                          value={currentForm.spouseRrn}
                          onChange={(e) => updateCurrent({ spouseRrn: e.target.value })}
                          className="h-[48px] w-[294px] rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-gray-300"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100" />

                  <div className="w-[100px]">
                    <RadioDropdown
                      label="자녀 유무"
                      value={currentForm.child}
                      onChange={setChild}
                      options={[
                        { value: "yes", label: "유" },
                        { value: "no", label: "무" },
                      ]}
                    />
                  </div>

                  {currentForm.child === "yes" && (
                    <>
                      <div className="space-y-6 max-w-[520px]">
                        {currentForm.children.map((c, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-x-10 gap-y-6">
                            <div>
                              <label className="mb-2 block text-[12px] text-gray-500">
                                {`자녀 ${idx + 1} 이름`}
                              </label>
                              <input
                                value={c.name}
                                onChange={(e) => updateChild(idx, { name: e.target.value })}
                                className="h-[48px] w-[100px] rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-gray-300"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[12px] text-gray-500">
                                {`자녀 ${idx + 1} 주민등록번호`}
                              </label>
                              <input
                                value={c.rrn}
                                onChange={(e) => updateChild(idx, { rrn: e.target.value })}
                                className="h-[48px] w-[294px] rounded-[4px] border border-gray-200 bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-gray-300"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addChild}
                        className="mt-2 inline-flex h-[34px] items-center rounded-[6px] border border-gray-200 bg-white px-4 text-[12px] text-gray-500 hover:bg-gray-50"
                      >
                        + 자녀 추가
                      </button>
                    </>
                  )}
                </div>
              </section>

              <div className="h-6" />
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-[40px] w-[80px] rounded-[6px] border border-gray-200 bg-white text-[13px] text-gray-500 hover:bg-gray-50"
          >
            이전
          </button>

          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={!allValid}
            className={[
              "h-[40px] w-[120px] rounded-[6px] border text-[13px] font-medium shadow-sm transition-colors bg-white",
              allValid
                ? "border-[#64A5FF] text-[#64A5FF] hover:bg-[#64A5FF]/10"
                : "border-gray-200 text-gray-300 cursor-not-allowed",
            ].join(" ")}
          >
            입력완료
          </button>
        </div>
      </div>
    </div>
  );
}