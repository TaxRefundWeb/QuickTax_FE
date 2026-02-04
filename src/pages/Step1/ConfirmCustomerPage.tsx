import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCustomer } from "../../lib/api/customers";

type CustomerForm = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string; // select 값 (옵션 or "custom")
  bankCustom: string; // UI에서 "직접 입력"일 때만 사용
  accountNumber: string;
  nationalityCode: string;
  nationality: string;
  finalFee: string;
};

type ConfirmNavState = { customerId?: number };

// 서버에서 내려온 고객 모델(필요한 필드만)
type CustomerDetail = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string; // 서버는 직접입력 은행명도 여기로 내려올 수 있음
  bank_number: string;
  nationality_code: string;
  nationality_name: string;
  final_fee_percent: string;
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

/** ✅ 은행 옵션(드롭다운에 있는 값들) */
const BANK_OPTIONS = [
  "KB국민",
  "신한",
  "우리",
  "하나",
  "NH농협",
  "IBK기업",
  "카카오뱅크",
  "토스뱅크",
] as const;

function isKnownBank(bank: string) {
  return BANK_OPTIONS.includes(bank as any);
}

// ✅ 서버 → UI폼 매핑 (직접입력 자동 처리)
function toCustomerFormFromServer(c: CustomerDetail): CustomerForm {
  const serverBank = (c.bank ?? "").trim();

  // 옵션에 있으면 그대로, 없으면 custom으로 돌리고 bankCustom에 서버 값을 넣기
  const bank =
    serverBank && isKnownBank(serverBank)
      ? serverBank
      : serverBank
      ? "custom"
      : "";

  const bankCustom = bank === "custom" ? serverBank : "";

  return {
    name: c.name ?? "",
    rrn: formatRRN(c.rrn ?? ""),
    phone: formatPhone(c.phone ?? ""),
    address: c.address ?? "",
    bank,
    bankCustom,
    accountNumber: c.bank_number ?? "",
    nationalityCode: c.nationality_code ?? "",
    nationality: c.nationality_name ?? "",
    finalFee: c.final_fee_percent ?? "",
  };
}

export default function ConfirmCustomerPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const customerId =
    (location.state as ConfirmNavState | null)?.customerId ?? null;

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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof customerId === "number") return;
    navigate("/", { replace: true });
  }, [customerId, navigate]);

  // 서버에서 고객정보 불러와서 폼 채우기
  useEffect(() => {
    if (typeof customerId !== "number") return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const res = await getCustomer(customerId);

        // res 구조가 ApiResponse 형태일 가능성이 높으니 방어적으로 꺼냄
        const customer: CustomerDetail =
          (res as any)?.result ??
          (res as any)?.data?.result ??
          (res as any)?.data ??
          (res as any);

        if (!mounted) return;
        setForm(toCustomerFormFromServer(customer));
      } catch (e) {
        console.error(e);
        alert("고객 정보를 불러오지 못했어요. (콘솔 확인)");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [customerId]);

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

  const isValid = useMemo(() => {
    const baseValid = Object.entries(form).every(([key, value]) => {
      if (key === "bankCustom") return true; // custom일 때만 아래에서 체크
      return value.trim() !== "";
    });

    if (!baseValid) return false;
    if (form.bank === "custom") return form.bankCustom.trim() !== "";
    return true;
  }, [form]);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    if (typeof customerId !== "number") return;

    try {
      setSubmitting(true);

      // 여기서는 “다음 단계로 이동”만. (수정 저장은 나중에 PATCH로)
      navigate("/step1/period", {
        state: { customerId },
      });
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
          입력하신 정보를 확인해주세요
        </h1>

        {loading && (
          <div className="mb-6 text-sm text-gray-500">
            고객 정보를 불러오는 중...
          </div>
        )}

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
                        // ✅ custom으로 바꾸면 기존 선택값을 bankCustom에 복사해두기(빈값이면)
                        bankCustom: prev.bankCustom.trim()
                          ? prev.bankCustom
                          : prev.bank && prev.bank !== "custom"
                          ? prev.bank
                          : "",
                      };
                    }

                    // ✅ 일반 옵션 선택하면 custom 입력값 비우기
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
                className={`${inputFixed} w-[320px]`}
              />
            </div>
          </div>

          {/* 입력완료 */}
          <div className="pt-11 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || submitting || loading}
              className={[
                "h-[48px] w-[181px] rounded-lg border text-base font-medium shadow-sm transition-colors bg-white",
                isValid && !submitting && !loading
                  ? "border-[#64A5FF] text-[#64A5FF] hover:bg-[#64A5FF]/10"
                  : "border-gray-200 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              {submitting ? "저장 중..." : "수정완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
