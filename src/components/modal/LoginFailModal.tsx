import { useEffect } from "react";
import logo from "../../assets/logo.png";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginFailModal({ open, onClose }: Props) {
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
      aria-labelledby="login-fail-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 16,
          padding: "32px 28px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        {/* 로고 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <img
            src={logo}
            alt="logo"
            style={{
              width: 64,
              height: 64,
              objectFit: "contain",
            }}
          />
        </div>

        {/* 타이틀 */}
        <div
          id="login-fail-title"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 12,
          }}
        >
          로그인 실패
        </div>

        {/* 내용 */}
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: "#4B5563",
            marginBottom: 24,
            whiteSpace: "pre-line",
          }}
        >
          아이디 또는 비밀번호가 올바르지 않습니다.
          <br/>
          계정 관련 문의는 아래로 연락 부탁드립니다.
          {"\n"}• 이메일: Iwantgohome@naver.com
          {"\n"}• 전화: 010-xxxx-xxxx
        </div>

        {/* 버튼 */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 12,
            border: "none",
            background: "#0061FE",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}