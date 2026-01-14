export default function AddCustomerPage() {
  return (
    <div className="w-screen flex justify-center"> 
      <div className="w-[540px]">
        <h1 className="mb-20 text-[24px] font-bold text-gray-900">
          신규 고객의 기본정보를 입력해주세요
        </h1>

        <form className="space-y-5">
          {/* 이름 / 주민등록번호 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">이름</label>
              <input
                type="text"
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-base text-gray-600">
                주민등록번호
              </label>
              <input
                type="text"
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300"
              />
            </div>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">전화번호</label>
            <input
              type="text"
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300"
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="mb-2 block text-base text-gray-600">주소</label>
            <input
              type="text"
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300"
            />
          </div>

          {/* 은행 / 계좌번호 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-base text-gray-600">은행</label>
              <select
                defaultValue=""
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-300"
              >
                <option value="" disabled>선택</option>
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
                type="text"
                placeholder="'-' 제외 입력"
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="pt-10 flex justify-end">
            <button
              type="button"
              className="h-[48px] w-[181px] rounded-md border border-gray-200 bg-white text-base text-gray-700 shadow-sm hover:bg-gray-50"
            >
              입력완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}