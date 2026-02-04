import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomer } from "../../lib/api/customers";

export type CustomerForm = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  bankCustom: string;
  accountNumber: string;
  nationalityCode: string;
  nationality: string;
  finalFee: string; // UI는 문자열로 들고 있다가, 전송할 때 number로 변환
};

// 백엔드 신규 고객 등록 Request Body 스펙 (DB가 INT면 number로 보내는 게 안전)
type CreateCustomerRequest = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  bank_number: string;
  nationality_code: string;
  nationality_name: string;
  final_fee_percent: number;
};

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

// UI 폼 → 백엔드 Request Body 변환
function toCreateCustomerRequest(form: CustomerForm): CreateCustomerRequest {
  // ✅ finalFee는 UI에서 숫자만 입력되도록 만들었지만, 방어적으로 한 번 더 digits만
  const feeText = onlyDigits(form.finalFee);
  const fee = feeText ? Number(feeText) : 0;

  return {
    name: form.name.trim(),
    rrn: form.rrn.replace("-", ""),
    phone: form.phone.replaceAll("-", ""),
    address: form.address.trim(),
    bank: (form.bank === "custom" ? form.bankCustom : form.bank).trim(),
    bank_number: form.accountNumber.replaceAll("-", "").trim(),
    nationality_code: form.nationalityCode.trim(),
    nationality_name: form.nationality.trim(),
    final_fee_percent: fee, // ✅ number로 전송
  };
}

export default function AddCustomerPage() {
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

  const [submitting, setSubmitting] = useState(false);

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

    // ✅ 최종 수수료: 숫자만 입력되게 강제
    if (name === "finalFee") {
      setForm((prev) => ({ ...prev, finalFee: onlyDigits(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValid = useMemo(() => {
    const baseValid = Object.entries(form).every(([key, value]) => {
      if (key === "bankCustom") return true; // bank가 custom일 때 아래에서 따로 체크
      return value.trim() !== "";
    });

    if (!baseValid) return false;
    if (form.bank === "custom") return form.bankCustom.trim() !== "";
    return true;
  }, [form]);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    try {
      setSubmitting(true);

      const payload = toCreateCustomerRequest(form);

      const res = await createCustomer(payload);
      console.log("createCustomer res:", res);

      if (!res.isSuccess) {
        alert(res.message || "신규 고객 생성에 실패했어요.");
        return;
      }

      const customerId = res.result;

      if (!customerId) {
        alert("customerId를 응답에서 못 찾았어. 콘솔의 res 구조 확인 필요!");
        return;
      }

      sessionStorage.setItem("customerId", String(customerId));
      navigate("/step2/period", {
        state: { customerId },
      });

    } catch (e) {
      console.error(e);
      alert("신규 고객 생성에 실패했어요. (콘솔 확인)");
    } finally {
      setSubmitting(false);
    }
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
          신규 고객의 기본정보를 입력해주세요
        </h1>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* 이름 / 주민등록번호 */}
          <div className="flex justify-between">
            <div>
              <label className="mb-2 block text-base text-gray-600">이름</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={`${inputFixed} w-[176px]`}
              />
            </div>

            <div>
              <label className="mb-2 block text-base text-gray-600">
                주민등록번호
              </label>
              <input
                name="rrn"
                type="text"
                value={form.rrn}
                onChange={handleChange}
                inputMode="numeric"
                className={`${inputFixed} w-[320px]`}
              />
            </div>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">전화번호</label>
            <input
              name="phone"
              type="text"
              value={form.phone}
              onChange={handleChange}
              inputMode="numeric"
              className={inputBase}
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">주소</label>
            <input
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              className={inputBase}
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
              >
                <option value="" disabled>
                  선택
                </option>
                <option value="KB국민">KB국민</option>
                <option value="신한">신한</option>
                <option value="우리">우리</option>
                <option value="하나">하나</option>
                <option value="NH농협">NH농협</option>
                <option value="IBK기업">IBK기업</option>
                <option value="카카오뱅크">카카오뱅크</option>
                <option value="토스뱅크">토스뱅크</option>
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
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-base text-gray-600">
                계좌번호
              </label>
              <input
                name="accountNumber"
                type="text"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="'-' 제외 입력"
                inputMode="numeric"
                className={`${inputFixed} w-[320px] text-gray-700`}
              />
            </div>
          </div>

          {/* 국적코드 / 국적 */}
          <div className="flex justify-between">
            <div>
              <label className="mb-2 block text-base text-gray-600">국적코드</label>
              <input
                name="nationalityCode"
                type="text"
                value={form.nationalityCode}
                onChange={handleChange}
                className={`${inputFixed} w-[104px]`}
              />
            </div>

            <div>
              <label className="mb-2 block text-base text-gray-600">국적</label>
              <input
                name="nationality"
                type="text"
                value={form.nationality}
                onChange={handleChange}
                className={`${inputFixed} w-[320px]`}
              />
            </div>
          </div>

          {/* 최종 수수료 */}
          <div className="flex justify-end">
            <div className="flex flex-col">
              <label className="mb-2 text-base text-gray-600">최종 수수료</label>
              <input
                name="finalFee"
                type="text"
                value={form.finalFee}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="예: 2"
                className={`${inputFixed} w-[320px]`}
              />
            </div>
          </div>

          {/* 입력완료 */}
          <div className="pt-11 flex justify-end">
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
              {submitting ? "저장 중..." : "입력완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
