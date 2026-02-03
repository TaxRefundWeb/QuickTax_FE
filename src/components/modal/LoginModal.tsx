import { useEffect, useMemo, useState } from "react";
import styles from "./LoginModal.module.css";

import { getCustomers, type Customer } from "../../lib/api/customers";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: () => void;

  onOpenStartModal: (customer: Customer) => void;

  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
};

// 백 응답 형태(최소한만)
type GetCustomersResponse = {
  isSuccess?: boolean;
  code?: string;
  message?: string;
  result?: {
    customers?: Array<{
      customerid?: number | string;
      name?: string;
      birthdate?: string;
      rrn?: string;
    }>;
  };
};

function normalizeCustomers(res: unknown): Customer[] {
  const r = res as GetCustomersResponse;

  const raw = r?.result?.customers ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((c) => {
      const idNum =
        typeof c.customerid === "number"
          ? c.customerid
          : typeof c.customerid === "string"
          ? Number(c.customerid)
          : NaN;

      if (!Number.isFinite(idNum)) return null;

      return {
        customerId: idNum,
        name: c.name ?? "",
        rrn: c.rrn,
        // Customer 타입에 birthdate가 없다면 아래 줄은 제거해도 됨
        birthdate: c.birthdate,
      } as Customer;
    })
    .filter((c): c is Customer => !!c && !!c.name);
}

export default function LoginModal({
  isOpen,
  onClose,
  onAddCustomer,
  onOpenStartModal,
  closeOnBackdropClick = false,
  closeOnEsc = false,
}: LoginModalProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 열리면 고객 목록 불러오기
  useEffect(() => {
    if (!isOpen) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getCustomers();
        const list = normalizeCustomers(res);

        if (!alive) return;
        setCustomers(list);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError("고객 목록을 불러오지 못했습니다.");
        setCustomers([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim();
    if (!q) return customers;

    return customers.filter((c) => {
      const nameHit = (c.name ?? "").includes(q);
      const rrnHit = (c.rrn ?? "").includes(q);
      const birthHit = ((c as any).birthdate ?? "").includes(q);
      return nameHit || rrnHit || birthHit;
    });
  }, [customers, query]);

  const selectedCustomer = useMemo(() => {
    if (typeof selectedId !== "number") return null;
    return filteredCustomers.find((c) => c.customerId === selectedId) ?? null;
  }, [filteredCustomers, selectedId]);

  // ESC 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEsc) onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose, closeOnEsc]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (isOpen) return;
    setQuery("");
    setSelectedId(null);
    setCustomers([]);
    setLoading(false);
    setError(null);
  }, [isOpen]);

  const handleRowSelect = (customerId: number) => {
    setSelectedId((prev) => (prev === customerId ? null : customerId));
  };

  const handleGoNext = () => {
    if (!selectedCustomer) return;
    onOpenStartModal(selectedCustomer);
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={() => {
        if (closeOnBackdropClick) onClose();
      }}
    >
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="고객 선택"
      >
        {/* 헤더 */}
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <h2 className={styles.headTitle}>
              <span className={styles.accent}>경정청구</span>를 진행할 고객을
              선택하세요
            </h2>
          </div>
        </div>

        {/* 검색 */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <input
              className={styles.searchInput}
              placeholder="고객명 또는 주민번호로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" className={styles.searchIcon} aria-label="검색">
              🔍
            </button>
          </div>
        </div>

        {/* 고객 선택 */}
        <div className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <div className={styles.thCheck} />
            <div className={styles.thName}>이름</div>
            <div className={styles.thBirth}>생년월일</div>
            <div className={styles.thRrn}>주민등록번호</div>
            <div className={styles.thArrow} />
          </div>

          <div className={styles.tableBody}>
            {loading && <div className={styles.empty}>불러오는 중...</div>}

            {error && <div className={styles.empty}>{error}</div>}

            {!loading && !error && filteredCustomers.length === 0 ? (
              <div className={styles.empty}>검색 결과가 없습니다.</div>
            ) : (
              !loading &&
              !error &&
              filteredCustomers.map((c) => {
                const isSelected = c.customerId === selectedId;
                const birth = (c as any).birthdate ?? "-";

                return (
                  <div
                    key={c.customerId}
                    className={[
                      styles.row,
                      isSelected ? styles.rowSelected : "",
                    ].join(" ")}
                    onClick={() => handleRowSelect(c.customerId)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* 체크 */}
                    <div className={styles.cellCheck}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={() => handleRowSelect(c.customerId)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="고객 선택"
                      />
                    </div>

                    {/* 이름 */}
                    <div className={styles.cellName}>
                      <div className={styles.avatar} />
                      <span className={styles.nameText}>{c.name}님</span>
                    </div>

                    {/* 생년월일 */}
                    <div className={styles.cellBirth}>{birth}</div>

                    {/* 주민번호 */}
                    <div className={styles.cellRrn}>{c.rrn ?? "-"}</div>

                    {/* 우측 화살표 */}
                    <button
                      type="button"
                      className={[
                        styles.arrowBtn,
                        isSelected ? styles.arrowActive : styles.arrowDisabled,
                      ].join(" ")}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelected) return;
                        handleGoNext();
                      }}
                      aria-label="다음"
                      disabled={!isSelected}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 2.5L8 6L4 9.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 하단 */}
        <div className={styles.footer}>
          <div />
          <button type="button" className={styles.addBtn} onClick={onAddCustomer}>
            신규 고객 추가
          </button>
        </div>
      </div>
    </div>
  );
}
