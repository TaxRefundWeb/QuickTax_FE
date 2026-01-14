import { useEffect } from "react";
import styles from "./LoginModal.module.css";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function LoginModal({
  isOpen,
  onClose,
  title = "고객 선택",
  children,
}: LoginModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
