import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type CustomerForm = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  accountNumber: string;
  nationalityCode: string;
  nationality: string;
  finalFee: string;
};

export default function ConfirmCustomerPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState<CustomerForm>({
    name: "",
    rrn: "",
    phone: "",
    address: "",
    bank: "",
    accountNumber: "",
    nationalityCode: "",
    nationality: "",
    finalFee: "",
  });

  const [baselineForm, setBaselineForm] = useState<CustomerForm | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const state = location.state as { form?: CustomerForm } | null;

    // state 없으면 입력 페이지로
    if (!state?.form) {
      navigate("/step1/add-customer", { replace: true });
      return;
    }

    // 최초 진입 시 1회만 세팅
    if (baselineForm === null) {
      setForm(state.form);
      setBaselineForm(state.form);
    }
  }, [location.state, navigate, baselineForm]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeftButton = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    // 취소 -> 원래 값으로
    if (baselineForm) setForm(baselineForm);
    setIsEditMode(false);
  };

  const handleRightButton = () => {
    if (!isEditMode) {
      // 최종 제출 자리
      console.log("최종 제출:", form);
      return;
    }

    // 수정 완료
    setBaselineForm(form);
    setIsEditMode(false);
  };

  const inputBase =
    "h-[48px] w-full rounded-md bg-[#FAFAFA] px-3 text-sm outline-none focus:ring-1 focus:ring-gray-300";
  const inputFixed =
    "h-[48px] rounded-md bg-[#FAFAFA] px-3 text-sm outline-none focus:ring-1 focus:ring-gray-300";
  const selectFixed =
    "h-[48px] rounded-md bg-[#FAFAFA] px-3 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-300";

  // 읽기/수정 모드에 따른 비활성 처리(스타일은 동일하게 두고 UX만 제한)
  const readonlyProps = (field: "input" | "select") => {
    if (field === "select") return { disabled: !isEditMode };
    return { readOnly: !isEditMode };
  };

  return (
    <div className="w-screen flex justify-center">
      <div className="w-[540px]">
        <div className="-mt-[120px]">
          <h1 className="mb-14 text-[24px] font-bold text-gray-900">
            입력된 정보를 확인해 주세요
          </h1>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* 이름 */}
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

            {/* 주민등록번호 */}
            <div>
              <label className="mb-2 block text-base text-gray-600">
                주민등록번호
              </label>
              <input
                name="rrn"
                value={form.rrn}
                onChange={handleChange}
                className={`${inputFixed} w-[320px]`}
                {...readonlyProps("input")}
              />
            </div>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="mb-2 pt-2 block text-base text-gray-600">
              전화번호
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputBase}
              {...readonlyProps("input")}
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="mb-2 pt-2 block text-base text-gray-600">주소</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputBase}
              {...readonlyProps("input")}
            />
          </div>

          {/* 은행 */}
          <div className="pt-2 flex justify-between">
            <div>
              <label className="mb-2 block text-base text-gray-600">은행</label>
              <select
                name="bank"
                value={form.bank}
                onChange={handleChange}
                className={`${selectFixed} w-[176px]`}
                {...readonlyProps("select")}
              >
                <option value="" disabled>
                  선택
                </option>
                <option value="kb">KB국민</option>
                <option value="sh">신한</option>
                <option value="wr">우리</option>
                <option value="hn">하나</option>
                <option value="nh">NH농협</option>
                <option value="ibk">IBK기업</option>
                <option value="kakao">카카오뱅크</option>
                <option value="toss">토스뱅크</option>
              </select>
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="mb-2 block text-base text-gray-600">
                계좌번호
              </label>
              <input
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="'-' 제외 입력"
                className={`${inputFixed} w-[320px] text-gray-700`}
                {...readonlyProps("input")}
              />
            </div>
          </div>

          {/* 국적코드 */}
          <div className="pt-2 flex justify-between">
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

            {/* 국적 */}
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

          {/* 최종 수수료*/}
          <div className="pt-2 flex">
            <div className="ml-auto flex flex-col">
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

          <div className="pt-11 flex">
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={handleLeftButton}
                className={[
                  "h-[48px] w-[181px] rounded-lg border text-base font-medium shadow-sm transition-colors bg-white",
                  "border-gray-200 text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {isEditMode ? "취소" : "정보 수정"}
              </button>

              <button
                type="button"
                onClick={handleRightButton}
                className={[
                  "h-[48px] w-[181px] rounded-lg border text-base font-medium shadow-sm transition-colors bg-white",
                  "border-[#64A5FF] text-[#64A5FF] hover:bg-[#64A5FF]/10",
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
