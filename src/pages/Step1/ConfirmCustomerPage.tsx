import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { patchCustomer } from "../../lib/api/customers";
import { api } from "../../lib/api/client";
import PatchModal from "../../components/modal/PatchModal";
import PatchAccessModal from "../../components/modal/PatchAccessModal";

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
  finalFee: string; // UI 입력은 문자열로 유지
};

type ConfirmNavState = { customerId?: number };

type CustomerDetail = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  bank_number: string;
  nationality_code: string;
  nationality_name: string;
  final_fee_percent: string | number;
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
    if (d.length <= 9)
      return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  }

  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

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

function toCustomerFormFromServer(c: CustomerDetail): CustomerForm {
  const serverBank = (c.bank ?? "").trim();

  const bank =
    serverBank && isKnownBank(serverBank) ? serverBank : serverBank ? "custom" : "";

  const bankCustom = bank === "custom" ? serverBank : "";

  return {
    name: c.name ?? "",
    rrn: formatRRN(String(c.rrn ?? "")),
    phone: formatPhone(String(c.phone ?? "")),
    address: String(c.address ?? ""),
    bank,
    bankCustom,
    accountNumber: String(c.bank_number ?? ""),
    nationalityCode: String(c.nationality_code ?? ""),
    nationality: String(c.nationality_name ?? ""),
    finalFee: String(c.final_fee_percent ?? ""),
  };
}

function toPatchPayload(f: CustomerForm) {
  const bankName = (f.bank === "custom" ? f.bankCustom : f.bank).trim();
  const fee = f.finalFee.replace(/[^\d.]/g, "").trim();

  return {
    name: f.name.trim(),
    rrn: onlyDigits(f.rrn),
    phone: onlyDigits(f.phone),
    address: f.address.trim(),
    bank: bankName,
    bank_number: onlyDigits(f.accountNumber).trim(),
    nationality_code: f.nationalityCode.trim(),
    nationality_name: f.nationality.trim(),
    final_fee_percent: fee,
  };
}

function stableStringify(obj: any) {
  const keys = Object.keys(obj).sort();
  const sorted: any = {};
  for (const k of keys) sorted[k] = obj[k];
  return JSON.stringify(sorted);
}

// ✅ 수정 불가 필드만 원상복구(폼의 다른 수정값은 유지)
function restoreLockedFields(prev: CustomerForm, original: CustomerForm): CustomerForm {
  return {
    ...prev,
    name: original.name,
    rrn: original.rrn,
    phone: original.phone,
    nationalityCode: original.nationalityCode,
    nationality: original.nationality,
  };
}

export default function ConfirmCustomerPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const rawCustomerId =
    (location.state as ConfirmNavState | null)?.customerId ??
    (() => {
      const v = sessionStorage.getItem("customerId");
      if (!v) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    })() ??
    null;

  const customerId =
    typeof rawCustomerId === "number" && Number.isFinite(rawCustomerId)
      ? rawCustomerId
      : null;

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

  const [originalForm, setOriginalForm] = useState<CustomerForm | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isPatchModalOpen, setIsPatchModalOpen] = useState(false);
  const [isPatchAccessModalOpen, setIsPatchAccessModalOpen] = useState(false);

  useEffect(() => {
    if (typeof customerId === "number") return;
    navigate("/", { replace: true });
  }, [customerId, navigate]);

  useEffect(() => {
    if (typeof customerId !== "number") return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const res = await api.get(`/customers/${customerId}?t=${Date.now()}`);
        const customer: CustomerDetail = (res.data as any)?.result ?? res.data;

        const next = toCustomerFormFromServer(customer);

        if (!mounted) return;
        setForm(next);
        setOriginalForm(next);

        sessionStorage.setItem("customerId", String(customerId));
      } catch (e) {
        console.error(e);
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
      if (key === "bankCustom") return true;
      return value.trim() !== "";
    });

    if (!baseValid) return false;
    if (form.bank === "custom") return form.bankCustom.trim() !== "";
    return true;
  }, [form]);

  const isDirty = useMemo(() => {
    if (!originalForm) return false;
    const a = toPatchPayload(originalForm);
    const b = toPatchPayload(form);
    return stableStringify(a) !== stableStringify(b);
  }, [originalForm, form]);

  // ✅ 수정 불가 필드 변경 체크
  const lockedFieldsChanged = useMemo(() => {
    if (!originalForm) return false;

    return (
      originalForm.name.trim() !== form.name.trim() ||
      onlyDigits(originalForm.rrn) !== onlyDigits(form.rrn) ||
      onlyDigits(originalForm.phone) !== onlyDigits(form.phone) ||
      originalForm.nationalityCode.trim() !== form.nationalityCode.trim() ||
      originalForm.nationality.trim() !== form.nationality.trim()
    );
  }, [originalForm, form]);

  const buttonLabel = isDirty ? "수정완료" : "입력완료";

  const handleSubmit = async () => {
    if (!isValid || submitting || loading) return;
    if (typeof customerId !== "number") return;

    if (!isDirty) {
      sessionStorage.setItem("customerId", String(customerId));
      navigate(`/${customerId}/step1/period`, { state: { customerId } });
      return;
    }

    // ✅ 수정 불가 필드 변경 시: PATCH 막고 모달 오픈
    if (lockedFieldsChanged) {
      setIsPatchAccessModalOpen(true);
      return;
    }

    try {
      setSubmitting(true);

      const payload = toPatchPayload(form);
      await patchCustomer(customerId, payload);

      const res = await api.get(`/customers/${customerId}?t=${Date.now()}`);
      const customer: CustomerDetail = (res.data as any)?.result ?? res.data;

      const next = toCustomerFormFromServer(customer);
      setForm(next);
      setOriginalForm(next);

      setIsPatchModalOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ “닫히면 무조건 원상복구” onClose 핸들러
  const handleCloseAccessModal = () => {
    setIsPatchAccessModalOpen(false);

    if (originalForm) {
      setForm((prev) => restoreLockedFields(prev, originalForm));
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
      <PatchModal
        open={isPatchModalOpen}
        onClose={() => setIsPatchModalOpen(false)}
      />

      {/* ✅ 닫힐 때마다 원상복구 */}
      <PatchAccessModal open={isPatchAccessModalOpen} onClose={handleCloseAccessModal} />

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
              <label className="mb-2 block text-base text-gray-600">계좌번호</label>
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
              {submitting ? "처리 중..." : buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}