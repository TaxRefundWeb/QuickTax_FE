import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function FindAccountModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="find-account-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 450,
          background: "#fff",
          borderRadius: 14,
          padding: "20px 20px 18px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            id="find-account-title"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            아이디 / 비밀번호 찾기
          </div>
        </div>

        {/* 내용 */}
        <div
          style={{
            fontSize: 20,
            lineHeight: 1.5,
            color: "#374151",
            marginBottom: 0,
          }}
        >
          계정 관련 문의는 아래로 연락 부탁드립니다.
          <br />
          • 이메일: Iwantgohome@naver.com
          <br />
          • 전화: 010-xxxx-xxxx
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 10,
              border: "none",
              background: "#64A5FF",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
