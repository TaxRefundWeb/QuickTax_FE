import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type CustomerForm = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  accountNumber: string;
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
  });

  const [baselineForm, setBaselineForm] = useState<CustomerForm | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const state = location.state as { form?: CustomerForm } | null;

    // ✅ state가 없으면 입력 페이지로 되돌리기 (라우트 통일)
    if (!state?.form) {
      navigate("/step1/add-customer", { replace: true });
      return;
    }

    // 최초 진입 시에만 state.form을 세팅
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
      setIsEditMode(true); // 정보 수정 모드 진입
      return;
    }

    // 취소: 원래 값으로 복구
    if (baselineForm) setForm(baselineForm);
    setIsEditMode(false);
  };

  const handleRightButton = () => {
    if (!isEditMode) {
      // 입력 완료 (최종 제출 자리)
      console.log("최종 제출:", form);
      return;
    }

    // 수정 완료: 기준값 업데이트
    setBaselineForm(form);
    setIsEditMode(false);
  };

  const inputBase =
    "h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-300";
  const readOnlyStyle = "bg-gray-50 text-gray-700";
  const editableStyle = "bg-white";

  return (
    <div className="w-screen flex justify-center">
      <div className="w-[540px]">
        <div className="-mt-20">
          <h1 className="mb-20 text-[24px] font-bold text-gray-900">
            입력된 정보를 확인해 주세요
          </h1>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* 이름 / 주민등록번호 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">이름</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                readOnly={!isEditMode}
                className={`${inputBase} ${
                  isEditMode ? editableStyle : readOnlyStyle
                }`}
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
                readOnly={!isEditMode}
                className={`${inputBase} ${
                  isEditMode ? editableStyle : readOnlyStyle
                }`}
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
              readOnly={!isEditMode}
              className={`${inputBase} ${
                isEditMode ? editableStyle : readOnlyStyle
              }`}
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">주소</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              readOnly={!isEditMode}
              className={`${inputBase} ${
                isEditMode ? editableStyle : readOnlyStyle
              }`}
            />
          </div>

          {/* 은행 / 계좌번호 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">은행</label>
              <select
                name="bank"
                value={form.bank}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-gray-300 ${
                  isEditMode ? "bg-white" : "bg-gray-50"
                }`}
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

            <div>
              <label className="mb-2 block text-base text-gray-600">계좌번호</label>
              <input
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                readOnly={!isEditMode}
                placeholder="'-' 제외 입력"
                className={`${inputBase} ${
                  isEditMode ? editableStyle : readOnlyStyle
                }`}
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="pt-10 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleLeftButton}
              className="h-[48px] w-[181px] rounded-lg border border-gray-200 bg-white text-base text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {isEditMode ? "취소" : "정보 수정"}
            </button>

            <button
              type="button"
              onClick={handleRightButton}
              className="h-[48px] w-[181px] rounded-lg bg-blue-600 text-base text-white shadow-sm hover:bg-blue-700"
            >
              {isEditMode ? "수정 완료" : "입력 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
