import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type CustomerForm = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  bankCustom: string;
  accountNumber: string;
  nationalityCode: string;
  nationality: string;
  finalFee: string;
};

const BANK_LIST = [
  "KB국민",
  "신한",
  "우리",
  "하나",
  "NH농협",
  "IBK기업",
  "카카오뱅크",
  "토스뱅크",
] as const;

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatRRN(value: string) {
  const digits = onlyDigits(value).slice(0, 13);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function formatPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);

  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  }

  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function ConfirmCustomerPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState<CustomerForm>({
    name: "",
    rrn: "",
    phone: "",
    address: "",
    bank: "",
    bankCustom: "",
    accountNumber: "",
    nationalityCode: "",
    nationality: "",
    finalFee: "",
  });

  const [baselineForm, setBaselineForm] = useState<CustomerForm | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const state = location.state as { form?: Partial<CustomerForm> } | null;

    if (!state?.form) {
      navigate("/step1/add-customer", { replace: true });
      return;
    }

    if (baselineForm === null) {
      const incoming: CustomerForm = {
        name: state.form.name ?? "",
        rrn: state.form.rrn ?? "",
        phone: state.form.phone ?? "",
        address: state.form.address ?? "",
        bank: state.form.bank ?? "",
        bankCustom: (state.form as any).bankCustom ?? "",
        accountNumber: state.form.accountNumber ?? "",
        nationalityCode: state.form.nationalityCode ?? "",
        nationality: state.form.nationality ?? "",
        finalFee: state.form.finalFee ?? "",
      };

      if (
        incoming.bank &&
        incoming.bank !== "custom" &&
        !BANK_LIST.includes(incoming.bank as any)
      ) {
        incoming.bankCustom = incoming.bank;
        incoming.bank = "custom";
      }

      setForm(incoming);
      setBaselineForm(incoming);
    }
  }, [location.state, navigate, baselineForm]);

  const readonlyProps = (field: "input" | "select") => {
    if (field === "select") return { disabled: !isEditMode };
    return { readOnly: !isEditMode };
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "rrn") {
      setForm((prev) => ({ ...prev, rrn: formatRRN(value) }));
      return;
    }
    if (name === "phone") {
      setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isEditValid = useMemo(() => {
    if (!isEditMode) return true;
    if (form.bank === "custom") return form.bankCustom.trim() !== "";
    return true;
  }, [isEditMode, form.bank, form.bankCustom]);

  const handleLeftButton = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    if (baselineForm) setForm(baselineForm);
    setIsEditMode(false);
  };

  const handleRightButton = () => {
    if (!isEditMode) {
      const finalBank = form.bank === "custom" ? form.bankCustom : form.bank;

      const finalForm: CustomerForm = {
        ...form,
        bank: finalBank,
        bankCustom: "",
      };

      console.log("최종 제출:", finalForm);
      navigate("/step1/period", { replace: true, state: { form: finalForm } });
      return;
    }

    if (!isEditValid) return;
    setBaselineForm(form);
    setIsEditMode(false);
  };

  const inputBase =
    "h-[48px] w-full rounded-lg border bg-[#FAFAFA] px-3 text-sm outline-none focus:ring-1 focus:ring-gray-300";
  const inputFixed =
    "h-[48px] rounded-lg border bg-[#FAFAFA] px-3 text-sm outline-none focus:ring-1 focus:ring-gray-300";
  const selectFixed =
    "h-[48px] rounded-lg border bg-[#FAFAFA] px-3 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-300";

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[540px]">
        <h1 className="mb-14 text-[24px] font-bold text-gray-900">
          입력된 정보를 확인해 주세요
        </h1>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* 이름 / 주민등록번호 */}
          <div className="flex justify-between">
            <div>
              <label className="mb-2 block text-base text-gray-600">이름</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`${inputFixed} w-[176px]`}
                {...readonlyProps("input")}
              />
            </div>

            <div>
              <label className="mb-2 block text-base text-gray-600">
                주민등록번호
              </label>
              <input
                name="rrn"
                value={form.rrn}
                onChange={handleChange}
                placeholder="######-#######"
                inputMode="numeric"
                className={`${inputFixed} w-[320px]`}
                {...readonlyProps("input")}
              />
            </div>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">전화번호</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              inputMode="numeric"
              className={inputBase}
              {...readonlyProps("input")}
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">주소</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputBase}
              {...readonlyProps("input")}
            />
          </div>

          {/* 은행 / 계좌번호 */}
          <div className="flex justify-between">
            <div>
              <label className="mb-2 block text-base text-gray-600">은행</label>

              <select
                name="bank"
                value={form.bank}
                onChange={(e) => {
                  const value = e.target.value;

                  setForm((prev) => {
                    if (value === "custom") {
                      return {
                        ...prev,
                        bank: "custom",
                        bankCustom: prev.bankCustom.trim()
                          ? prev.bankCustom
                          : prev.bank && prev.bank !== "custom"
                          ? prev.bank
                          : "",
                      };
                    }

                    return {
                      ...prev,
                      bank: value,
                      bankCustom: "",
                    };
                  });
                }}
                className={`${selectFixed} w-[176px]`}
                disabled={!isEditMode}
              >
                <option value="" disabled>
                  선택
                </option>
                {BANK_LIST.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="custom">직접 입력</option>
              </select>

              {form.bank === "custom" && (
                <input
                  name="bankCustom"
                  type="text"
                  value={form.bankCustom}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      bank: "custom",
                      bankCustom: v,
                    }));
                  }}
                  placeholder="은행명을 입력하세요"
                  className={`${inputFixed} w-[176px] mt-2`}
                  disabled={!isEditMode}
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-base text-gray-600">
                계좌번호
              </label>
              <input
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="'-' 제외 입력"
                inputMode="numeric"
                className={`${inputFixed} w-[320px] text-gray-700`}
                {...readonlyProps("input")}
              />
            </div>
          </div>

          {/* 국적코드 / 국적 */}
          <div className="flex justify-between">
            <div>
              <label className="mb-2 block text-base text-gray-600">
                국적코드
              </label>
              <input
                name="nationalityCode"
                value={form.nationalityCode}
                onChange={handleChange}
                className={`${inputFixed} w-[104px]`}
                {...readonlyProps("input")}
              />
            </div>

            <div>
              <label className="mb-2 block text-base text-gray-600">국적</label>
              <input
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                className={`${inputFixed} w-[320px]`}
                {...readonlyProps("input")}
              />
            </div>
          </div>

          {/* 최종 수수료 */}
          <div className="flex justify-end">
            <div className="flex flex-col">
              <label className="mb-2 text-base text-gray-600">최종 수수료</label>
              <input
                name="finalFee"
                value={form.finalFee}
                onChange={handleChange}
                className={`${inputFixed} w-[320px]`}
                {...readonlyProps("input")}
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="pt-11 flex justify-end">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleLeftButton}
                className="h-[48px] w-[181px] rounded-lg border border-gray-200 bg-white text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                {isEditMode ? "취소" : "정보수정"}
              </button>

              <button
                type="button"
                onClick={handleRightButton}
                disabled={isEditMode && !isEditValid}
                className={[
                  "h-[48px] w-[181px] rounded-lg border text-base font-medium shadow-sm transition-colors bg-white",
                  isEditMode && !isEditValid
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-[#64A5FF] text-[#64A5FF] hover:bg-[#64A5FF]/10",
                ].join(" ")}
              >
                {isEditMode ? "수정완료" : "입력완료"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
