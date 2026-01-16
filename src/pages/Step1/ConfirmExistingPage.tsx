import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type ExistingForm = {
  reduction: "yes" | "no";
  reduceStart: string;
  reduceEnd: string;
  year: string;
  workStart: string;
  workEnd: string;
  bizNo: string;
  spouse: "yes" | "no";
  child: "yes" | "no";
};

export default function ConfirmExistingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState<ExistingForm>({
    reduction: "no",
    reduceStart: "",
    reduceEnd: "",
    year: "",
    workStart: "",
    workEnd: "",
    bizNo: "",
    spouse: "no",
    child: "no",
  });

  const [baselineForm, setBaselineForm] = useState<ExistingForm | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const state = location.state as { form?: ExistingForm } | null;

    if (!state?.form) {
      navigate("/step1/existing", { replace: true });
      return;
    }

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

    // 취소 → 원래 값 복구
    if (baselineForm) setForm(baselineForm);
    setIsEditMode(false);
  };

  const handleRightButton = () => {
    if (!isEditMode) {
      // 최종 제출
      console.log("기존 고객 경정청구 최종 제출:", form);
      return;
    }

    // 수정 완료
    setBaselineForm(form);
    setIsEditMode(false);
  };

  const inputBase =
    "h-10 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-300";
  const readOnlyStyle = "bg-gray-50 text-gray-700";
  const editableStyle = "bg-white";

  return (
    <div className="w-screen flex justify-center">
      <div className="w-[540px]">
        <div className="-mt-8">
          <h1 className="mb-4 text-[24px] font-bold text-gray-900">
            경정청구 신청
          </h1>
          <p className="mt-2 mb-[72px] text-[16px] text-gray-500">
            입력한 정보가 맞는지 확인해주세요
          </p>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* 감면처리 여부 / 감면 기간 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">
                감면처리 여부
              </label>
              <select
                name="reduction"
                value={form.reduction}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`${inputBase} w-[104px] ${
                  isEditMode ? editableStyle : readOnlyStyle
                }`}
              >
                <option value="yes">여</option>
                <option value="no">부</option>
              </select>
            </div>

            <div className="justify-self-end">
              <label className="mb-2 block text-base text-gray-600">
                감면 기간
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="reduceStart"
                  value={form.reduceStart}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={`${inputBase} w-[132px] ${
                    isEditMode ? editableStyle : readOnlyStyle
                  }`}
                />
                <span className="text-gray-300">—</span>
                <input
                  type="date"
                  name="reduceEnd"
                  value={form.reduceEnd}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={`${inputBase} w-[132px] ${
                    isEditMode ? editableStyle : readOnlyStyle
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 원천징수 영증 / 근무 기간 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">
                원천징수 영수증 년도
              </label>
              <input
                name="year"
                value={form.year}
                onChange={handleChange}
                readOnly={!isEditMode}
                className={`${inputBase} w-[160px] ${
                  isEditMode ? editableStyle : readOnlyStyle
                }`}
              />
            </div>

            <div className="justify-self-end">
              <label className="mb-2 block text-base text-gray-600">
                근무 기간
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="workStart"
                  value={form.workStart}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={`${inputBase} w-[132px] ${
                    isEditMode ? editableStyle : readOnlyStyle
                  }`}
                />
                <span className="text-gray-300">—</span>
                <input
                  type="date"
                  name="workEnd"
                  value={form.workEnd}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={`${inputBase} w-[132px] ${
                    isEditMode ? editableStyle : readOnlyStyle
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 사업자 등록번호 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">
              사업자 등록번호
            </label>
            <input
              name="bizNo"
              value={form.bizNo}
              onChange={handleChange}
              readOnly={!isEditMode}
              className={`${inputBase} w-full ${
                isEditMode ? editableStyle : readOnlyStyle
              }`}
            />
          </div>

          {/* 배우자 / 자녀 */}

            <div>
              <label className="mb-2 block text-base text-gray-600">
                배우자 유무
              </label>
              <select
                name="spouse"
                value={form.spouse}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`${inputBase} w-[104px] ${
                  isEditMode ? editableStyle : readOnlyStyle
                }`}
              >
                <option value="yes">유</option>
                <option value="no">무</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-base text-gray-600">
                자녀 유무
              </label>
              <select
                name="child"
                value={form.child}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`${inputBase} w-[104px] ${
                  isEditMode ? editableStyle : readOnlyStyle
                }`}
              >
                <option value="yes">유</option>
                <option value="no">무</option>
              </select>
            </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3">
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
              className="h-[48px] w-[181px] rounded-lg border border-[#64A5FF] text-[#64A5FF] bg-white shadow-sm hover:bg-[#64A5FF]/10"
            >
              {isEditMode ? "수정 완료" : "입력완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
