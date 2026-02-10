import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./Login.module.css";

import FindAccountModal from "../../components/modal/FindAccountModal";
import LoginFailModal from "../../components/modal/LoginFailModal";
import SignupModal from "../../components/modal/SignupModal"; // ✅ 추가

import { login } from "../../lib/api/auth";
import { useCustomerListModal } from "../../contexts/customerListModalContext";
import { getCustomers } from "../../lib/api/customers";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [isLoginFailOpen, setIsLoginFailOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false); // ✅ 추가
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { openLoginModal } = useCustomerListModal();

  // 모달 중복 오픈 방지(StrictMode/useEffect 2회 실행 대비)
  const openedOnceRef = useRef(false);

  // 쿠키(accessToken)로 이미 로그인 상태면, 루트 진입 시 모달 바로 오픈
  useEffect(() => {
    let alive = true;

    (async () => {
      // 이미 한 번 열었다면 더 이상 시도하지 않음
      if (openedOnceRef.current) return;

      try {
        await getCustomers(); // 200이면 로그인 상태
        if (!alive) return;

        // 여기서 락 걸고 1회만 오픈
        openedOnceRef.current = true;
        openLoginModal();
      } catch {
        // not logged in
      }
    })();

    return () => {
      alive = false;
    };
  }, [openLoginModal]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!id || !pw) {
      setIsLoginFailOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(id, pw); // 성공하면 HttpOnly 쿠키에 accessToken 저장됨

      // 로그인 성공 시에도 중복 오픈 방지
      if (!openedOnceRef.current) {
        openedOnceRef.current = true;
        openLoginModal();
      }
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

          <button className={styles.button} type="submit" disabled={isSubmitting}>
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

            <button
              type="button"
              className={styles.link}
              onClick={() => setIsSignupModalOpen(true)}
            >
              회원가입
            </button>
          </div>
        </form>
      </div>

      <FindAccountModal
        open={isFindModalOpen}
        onClose={() => setIsFindModalOpen(false)}
      />
      <LoginFailModal
        open={isLoginFailOpen}
        onClose={() => setIsLoginFailOpen(false)}
      />

      {/* ✅ 회원가입 모달 연결 */}
      <SignupModal
        open={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </div>
  );
}