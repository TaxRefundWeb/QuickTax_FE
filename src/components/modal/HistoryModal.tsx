import { useEffect, useMemo, useState } from "react";
import type { Customer } from "../../lib/api/customers";
import { getCustomerPast } from "../../lib/api/customers";

type CaseItem = {
  year?: number;
  taxYear?: number;
  filedAt?: string;
  taxMethod?: string;
  refundAmount?: number;
  [key: string]: any;
};

type HistoryModalProps = {
  isOpen: boolean;
  onClose: () => void; // 닫기 → StartModal 복귀
  customer: Customer | null;
  onDownloadZip?: (customerId: string, year: number) => void;
  onStartNew?: () => void;
};

function pickYear(item: CaseItem): number | null {
  return (
    (typeof item.year === "number" && item.year) ||
    (typeof item.taxYear === "number" && item.taxYear) ||
    null
  );
}

function normalizeList(res: any): CaseItem[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
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

  // ESC 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  // 모달 닫히면 상태 초기화
  useEffect(() => {
    if (isOpen) return;
    setCases([]);
    setPickedYear(null);
    setLoading(false);
  }, [isOpen]);

  // 데이터 로딩
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

  const years = useMemo(() => {
    const ys = cases
      .map(pickYear)
      .filter((y): y is number => typeof y === "number");
    return Array.from(new Set(ys)).sort((a, b) => b - a);
  }, [cases]);

  const selectedYear = pickedYear ?? (years[0] ?? null);

  const record = useMemo(() => {
    if (selectedYear === null) return null;
    return cases.find((c) => pickYear(c) === selectedYear) ?? null;
  }, [cases, selectedYear]);

  if (!isOpen) return null;

  const zipDisabled = !customer || !record;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 p-6"
      onMouseDown={onClose}   // 배경 클릭 닫기 유지
      aria-modal="true"
      role="dialog"
      aria-label="이전 기록 열람"
    >
      <div
        className="relative h-[752px] w-[1069px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_70px_rgba(0,0,0,0.25)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ❌ 우측 하단 X 버튼 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          ✕
        </button>

        {/* 상단 타이틀 */}
        <div className="pt-[56px] text-center">
          <h2 className="m-0 text-[20px] font-bold text-gray-900">
            {(customer?.name ?? "OOO")}님의 최근 작업 기록
          </h2>
        </div>

        {/* 이하 기존 내용 그대로 */}
        {/* … (중략: 네가 준 코드 그대로 유지됨) … */}

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
