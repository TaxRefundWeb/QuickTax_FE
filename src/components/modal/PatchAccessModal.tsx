import { useEffect } from "react";
import logo from "../../assets/logo.png";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PatchAccessModal({ open, onClose }: Props) {
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
      aria-labelledby="patch-access-title"
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
          id="patch-access-title"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 12,
          }}
        >
          일부 항목은 수정할 수 없어요
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
          이름, 주민등록번호는 수정이 불가능합니다.
          <br/>해당 정보 변경이 필요할 경우
          <br/>관리자에게 문의해주세요.
          <br/>
          <br/>• 이메일: Iwantgohome@naver.com
          <br/>• 전화: 010-xxxx-xxxx
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