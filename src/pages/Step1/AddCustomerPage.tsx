import { useState } from "react";
import { useNavigate } from "react-router-dom";

type CustomerForm = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  accountNumber: string;
};

export default function AddCustomerPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<CustomerForm>({
    name: "",
    rrn: "",
    phone: "",
    address: "",
    bank: "",
    accountNumber: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // TODO: 여기서 간단 검증도 가능
    navigate("/step1/confirm", { state: { form } });
  };

  const inputBase =
    "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300";

  return (
    <div className="w-screen flex justify-center">
      <div className="w-[540px]">
        <div className="-mt-20">
          <h1 className="mb-20 text-[24px] font-bold text-gray-900">
            신규 고객의 기본정보를 입력해주세요
          </h1>
        </div>
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* 이름 / 주민등록번호 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">이름</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={inputBase}
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
                className={inputBase}
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
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">은행</label>
              <select
                name="bank"
                value={form.bank}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-300"
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
                type="text"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="'-' 제외 입력"
                className={inputBase}
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="pt-10 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="h-[48px] w-[181px] rounded-lg border border-gray-200 bg-white text-base text-gray-700 shadow-sm hover:bg-gray-50"
            >
              입력완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
