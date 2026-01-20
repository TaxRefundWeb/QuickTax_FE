import { useEffect, useState } from "react";
import styles from "./LoginModal.module.css";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: () => void;

  // ✅ 임시 버튼 클릭 시 StartModal을 열어달라고 부모에게 알림
  onOpenStartModal: () => void;
};

export default function LoginModal({
  isOpen,
  onClose,
  onAddCustomer,
  onOpenStartModal,
}: LoginModalProps) {
  const [query, setQuery] = useState("");

  // ESC 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
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
              onClick={() => {
                console.log("검색 클릭");
              }}
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
          </div>

          <div className={styles.tableBody}>
            <div className={styles.empty}>아직 등록된 고객이 없습니다.</div>

            {/* ✅ 임시 버튼: StartModal 오픈 */}
            <button
              type="button"
              className={styles.tempButton}
              onClick={onOpenStartModal}
            >
              임시 버튼
            </button>
          </div>
        </div>

        {/* 하단 */}
        <div className={styles.footer}>
          <div />
          <button
            type="button"
            className={styles.addBtn}
            onClick={onAddCustomer}
          >
            신규 고객 추가
          </button>
        </div>
      </div>
    </div>
  );
}
