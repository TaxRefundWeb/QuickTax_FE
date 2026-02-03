import { useEffect, useMemo, useState } from "react";
import type { Customer } from "../../lib/api/customers";
import { getCustomerPast } from "../../lib/api/customers";

type CaseItem = {
  year?: number; // 백 필드명이 다를 수 있어서 optional
  taxYear?: number;
  filedAt?: string;
  taxMethod?: string;
  refundAmount?: number;
  // 필요하면 추가
  [key: string]: any;
};

type HistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;

  customer: Customer | null;

  // 나중에 기능 추가할 때 쓰려고 남겨둠
  onDownloadZip?: (customerId: string, year: number) => void;
  onStartNew?: () => void;
};

function pickYear(item: CaseItem): number | null {
  const y =
    (typeof item.year === "number" && item.year) ||
    (typeof item.taxYear === "number" && item.taxYear) ||
    null;

  return y;
}

function normalizeList(res: any): CaseItem[] {
  // 1) res가 이미 배열
  if (Array.isArray(res)) return res;

  // 2) ApiResponse { data: [...] }
  if (Array.isArray(res?.data)) return res.data;

  // 3) ApiResponse { data: { data: [...] } } 같은 2중 구조
  if (Array.isArray(res?.data?.data)) return res.data.data;

  return [];
}

export default function HistoryModal({
  isOpen,
  onClose,
  customer,
  onStartNew,
}: HistoryModalProps) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [pickedYear, setPickedYear] = useState<number | null>(null);

  const customerId = customer?.customerId ?? null;

  // 모달 닫히면 상태 초기화(잔상 방지)
  useEffect(() => {
    if (isOpen) return;
    setCases([]);
    setPickedYear(null);
    setLoading(false);
  }, [isOpen]);

  // 모달 열리고 customer가 있으면 cases 불러오기
  useEffect(() => {
    if (!isOpen) return;
    if (typeof customerId !== "number") return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const res = await getCustomerPast(customerId);
        const list = normalizeList(res);

        if (!alive) return;
        setCases(list);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setCases([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, customerId]);

  // customer 바뀌면 선택 연도 초기화
  useEffect(() => {
    setPickedYear(null);
  }, [customerId]);

  // cases에서 year 목록 만들기
  const years = useMemo(() => {
    const ys = cases
      .map(pickYear)
      .filter((y): y is number => typeof y === "number");
    return Array.from(new Set(ys)).sort((a, b) => b - a);
  }, [cases]);

  const selectedYear = pickedYear ?? (years[0] ?? null);

  // 선택 연도의 record(케이스) 하나 고르기
  const record = useMemo(() => {
    if (selectedYear === null) return null;
    return cases.find((c) => pickYear(c) === selectedYear) ?? null;
  }, [cases, selectedYear]);

  // 버튼은 "UI만" (나중에 기능 추가)
  const handleZipClick = () => {
    console.log("zip 다운로드(추후 연결):", customerId, selectedYear);
  };

  const handlePdfClick = () => {
    console.log("pdf 다운로드(추후 연결):", customerId, selectedYear);
  };

  const handleStartNew = () => {
    if (!customerId) return;
    onStartNew?.();
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

        <div className="absolute left-0 right-0 top-[178px] px-[95px]">
          <div className="grid grid-cols-[141px_24px_592px_19px_138px]">
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
                ) : loading ? (
                  <div className="p-4 text-[14px] text-gray-500">
                    불러오는 중...
                  </div>
                ) : years.length === 0 ? (
                  <div className="p-4 text-[14px] text-gray-500">
                    기록이 없습니다.
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
                ) : loading ? (
                  <div className="p-2 text-[12px] text-gray-500">
                    불러오는 중...
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
                      {customer.rrn ?? "-"}
                    </div>

                    <div className="text-[16px] text-gray-500">세금 계산 방식</div>
                    <div className="text-[16px] font-semibold text-gray-900">
                      {record.taxMethod ?? "-"}
                    </div>

                    <div className="text-[16px] text-gray-500">환급금 금액</div>
                    <div className="text-[16px] font-semibold text-gray-900">
                      {(record.refundAmount ?? 0).toLocaleString()}원
                    </div>

                    <div className="text-[16px] text-gray-500">
                      경정청구 처리 일자
                    </div>
                    <div className="text-[16px] font-semibold text-gray-900">
                      {record.filedAt ?? "-"}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 우측부 */}
            <section className="col-start-5 flex flex-col items-end gap-3">
              <button
                type="button"
                onClick={handleZipClick}
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
                onClick={handlePdfClick}
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
            onClick={handleStartNew}
            className="h-[67px] w-[251px] rounded-[8px] bg-[#0061FE] text-[20px] font-bold text-white hover:brightness-95 active:brightness-90"
          >
            새 경정청구 신청하기
          </button>
        </div>
      </div>
    </div>
  );
}
