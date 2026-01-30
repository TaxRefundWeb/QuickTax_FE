import { useEffect, useMemo, useState } from "react";
import type { Customer } from "../../data/customersDummy";

type HistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;

  customer: Customer | null;

  onDownloadZip?: (customerId: string, year: number) => void;
  onStartNew?: () => void;
};

export default function HistoryModal({
  isOpen,
  onClose,
  customer,
  onDownloadZip,
  onStartNew,
}: HistoryModalProps) {
  const years = useMemo(() => {
    if (!customer) return [];
    return Array.from(new Set(customer.records.map((r) => r.year))).sort(
      (a, b) => b - a
    );
  }, [customer]);

  const [pickedYear, setPickedYear] = useState<number | null>(null);

  useEffect(() => {
    setPickedYear(null);
  }, [customer?.id]);

  const selectedYear = pickedYear ?? (years[0] ?? null);

  const record = useMemo(() => {
    if (!customer || selectedYear === null) return null;
    return customer.records.find((r) => r.year === selectedYear) ?? null;
  }, [customer, selectedYear]);

  const handleDownloadZip = () => {
    if (!customer || selectedYear === null) return;
    if (onDownloadZip) return onDownloadZip(customer.id, selectedYear);
    console.log("zip 다운로드(임시):", customer.id, selectedYear);
  };

  if (!isOpen) return null;

  const zipDisabled = !customer || !record;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 p-6"
      onMouseDown={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="이전 기록 열람"
    >
      <div
        className="relative h-[752px] w-[1069px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_70px_rgba(0,0,0,0.25)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 상단 타이틀 */}
        <div className="pt-[56px] text-center">
          <h2 className="m-0 text-[20px] font-bold text-gray-900">
            {(customer?.name ?? "OOO")}님의 최근 작업 기록
          </h2>
        </div>

        <div
          className="
            absolute
            left-0
            right-0
            top-[178px]
            px-[95px]
          "
        >
          <div
            className="
              grid
              grid-cols-[141px_24px_592px_19px_138px]
            "
          >
            {/* 좌측부 */}
            <section className="col-start-1 relative">
              <div className="absolute -top-[30px] left-[10px] text-[12px] text-gray-500">
                년도별 기록 조회
              </div>

              <div className="h-[392px] w-[141px] rounded-[8px] border border-gray-200 p-[14px]">
                {!customer ? (
                  <div className="p-4 text-[14px] text-gray-500">
                    선택된 고객이 없습니다.
                  </div>
                ) : years.length === 0 ? (
                  <div className="p-4 text-[20px] text-gray-500">
                    
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-[10px]">
                    {years.map((y) => {
                      const active = y === selectedYear;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setPickedYear(y)}
                          className={[
                            "w-[117px] h-[39px] rounded-[6px] border text-[14px] transition-colors",
                            active
                              ? "border-[#64A5FF] bg-[#64A5FF] text-white"
                              : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* 중앙부 */}
            <section className="col-start-3 relative">
              <div className="absolute -top-[35px] left-[13px] whitespace-nowrap text-[16px] font-bold text-gray-900">
                {selectedYear ? `${selectedYear}년 귀속분 기록` : "귀속분 기록"}
              </div>

              <div className="h-[392px] w-[592px] rounded-[8px] border border-gray-200 px-7 py-6">
                {!customer ? (
                  <div className="p-2 text-[12px] text-gray-500">
                    선택된 고객이 없습니다.
                  </div>
                ) : !record ? (
                  <div className="p-2 text-[20px] text-gray-500">
                    기록이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-[140px_1fr] gap-x-[61px] gap-y-[31px] pt-[20px] p-[20px]">
                    <div className="text-[16px] text-gray-500">이름</div>
                    <div className="text-[16px] font-semibold text-gray-900">
                      {customer.name}
                    </div>

                    <div className="text-[16px] text-gray-500">주민등록번호</div>
                    <div className="text-[16px] font-semibold text-gray-900">
                      {customer.rrn}
                    </div>

                    <div className="text-[16px] text-gray-500">세금 계산 방식</div>
                    <div className="text-[16px] font-semibold text-gray-900">
                      {record.taxMethod}
                    </div>

                    <div className="text-[16px] text-gray-500">환급금 금액</div>
                    <div className="text-[16px] font-semibold text-gray-900">
                      {record.refundAmount.toLocaleString()}원
                    </div>

                    <div className="text-[16px] text-gray-500">경정청구 처리 일자</div>
                    <div className="text-[16px] font-semibold text-gray-900">
                      {record.filedAt}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 우측부 */}
            <section className="col-start-5 flex flex-col items-end gap-3">
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={zipDisabled}
                className={[
                  "h-[40px] w-[138px] rounded-[4px] border px-3 text-[12px] transition-colors",
                  zipDisabled
                    ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                    : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                ].join(" ")}
              >
                zip 파일 다운로드
              </button>
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={zipDisabled}
                className={[
                  "h-[40px] w-[138px] rounded-[4px] border px-3 text-[12px] transition-colors",
                  zipDisabled
                    ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                    : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                ].join(" ")}
              >
                PDF 다운로드
              </button>
            </section>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-11">
          <button
            type="button"
            onClick={onStartNew}
            className="h-[67px] w-[251px] rounded-[8px] bg-[#0061FE] text-[20px] font-bold text-white hover:brightness-95 active:brightness-90"
          >
            새 경정청구 신청하기
          </button>
        </div>
      </div>
    </div>
  );
}
