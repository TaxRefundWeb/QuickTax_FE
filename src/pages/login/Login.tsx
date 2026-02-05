import { useState } from "react";
import styles from "./Login.module.css";

import FindAccountModal from "../../components/modal/FindAccountModal";
import LoginFailModal from "../../components/modal/LoginFailModal";

import { login } from "../../lib/api/auth";
import { useCustomerListModal } from "../../contexts/customerListModalContext";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  // 아이디/비밀번호 찾기 안내 모달
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);

  // 로그인 실패 모달
  const [isLoginFailOpen, setIsLoginFailOpen] = useState(false);

  // 로그인 진행 상태(중복 클릭 방지)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 전역 고객목록 모달 오픈
  const { openLoginModal } = useCustomerListModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !pw) {
      setIsLoginFailOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(id, pw);

      // 로그인 성공 → 고객 선택 모달(전역) 열기
      openLoginModal();
    } catch (err) {
      console.error(err);
      setIsLoginFailOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.blueArc} />
      <div className={styles.container}>
        <div className={styles.title}>QuickTax</div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <div className={styles.label}>세무사 관리번호</div>
            <input
              className={styles.input}
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>비밀번호</div>
            <input
              className={styles.input}
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            className={styles.button}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "로그인 중..." : "로그인하기"}
          </button>

          <div className={styles.links}>
            <button
              type="button"
              className={styles.link}
              onClick={() => setIsFindModalOpen(true)}
            >
              아이디 / 비밀번호 찾기
            </button>

            <button type="button" className={styles.link}>
              회원가입
            </button>
          </div>
        </form>
      </div>

      {/* 아이디/비밀번호 찾기 안내 모달 */}
      <FindAccountModal
        open={isFindModalOpen}
        onClose={() => setIsFindModalOpen(false)}
      />

      {/* 로그인 실패 모달 */}
      <LoginFailModal
        open={isLoginFailOpen}
        onClose={() => setIsLoginFailOpen(false)}
      />
    </div>
  );
}