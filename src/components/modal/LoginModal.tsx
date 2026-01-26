import { useEffect, useMemo, useState } from "react";
import styles from "./LoginModal.module.css";

// 더미데이터 import
import {
  customersDummy,
  filterCustomers,
  type Customer,
} from "../../data/customersDummy";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: () => void;

  // 선택된 고객을 부모(Login.tsx)로 전달
  onOpenStartModal: (customer: Customer) => void;

  // 추가: 밖 클릭/ESC로 닫을지 여부
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
};

export default function LoginModal({
  isOpen,
  onClose,
  onAddCustomer,
  onOpenStartModal,
  closeOnBackdropClick = false, // 기본: 밖 클릭으로 닫지 않음
  closeOnEsc = false,           // 기본: ESC로 닫지 않음
}: LoginModalProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 검색 결과
  const filteredCustomers = useMemo(() => {
    return filterCustomers(customersDummy, query);
  }, [query]);

  const selectedCustomer = useMemo(() => {
    return filteredCustomers.find((c) => c.id === selectedId) ?? null;
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

  // 모달 "닫힐 때" 선택/검색 초기화
  useEffect(() => {
    if (isOpen) return;
    setQuery("");
    setSelectedId(null);
  }, [isOpen]);

  const handleRowSelect = (customerId: string) => {
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
              placeholder="고객명 또는 생년월일로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="button"
              className={styles.searchIcon}
              aria-label="검색"
              onClick={() => console.log("검색:", query)}
            >
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
            {filteredCustomers.length === 0 ? (
              <div className={styles.empty}>검색 결과가 없습니다.</div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = c.id === selectedId;

                return (
                  <div
                    key={c.id}
                    className={[
                      styles.row,
                      isSelected ? styles.rowSelected : "",
                    ].join(" ")}
                    onClick={() => handleRowSelect(c.id)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* 체크 */}
                    <div className={styles.cellCheck}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={() => handleRowSelect(c.id)}
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
                    <div className={styles.cellBirth}>{c.birthDate}</div>

                    {/* 주민번호 */}
                    <div className={styles.cellRrn}>{c.rrn}</div>

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
