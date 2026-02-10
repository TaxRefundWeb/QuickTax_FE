import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./Login.module.css";

import FindAccountModal from "../../components/modal/FindAccountModal";
import LoginFailModal from "../../components/modal/LoginFailModal";
import SignupModal from "../../components/modal/SignupModal";

import { login } from "../../lib/api/auth";
import { useCustomerListModal } from "../../contexts/customerListModalContext";
import { getCustomers } from "../../lib/api/customers";
import { checkHealth } from "../../lib/api/health";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [isLoginFailOpen, setIsLoginFailOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { openLoginModal } = useCustomerListModal();

  // 로그인 모달 중복 오픈 방지
  const openedOnceRef = useRef(false);

  // health 체크 중복 실행 방지 (StrictMode 대응)
  const healthOnceRef = useRef(false);

  useEffect(() => {
    if (healthOnceRef.current) return;
    healthOnceRef.current = true;

    let alive = true;

    checkHealth()
      .then((msg) => {
        if (!alive) return;
        console.log("🩺 health OK:", msg);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("🩺 health FAIL:", err);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (openedOnceRef.current) return;

      try {
        await getCustomers(); // 200이면 로그인 상태
        if (!alive) return;

        openedOnceRef.current = true;
        openLoginModal();
      } catch {
        // 로그인 안 된 상태 → 아무것도 안 함
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
      await login(id, pw); // HttpOnly 쿠키 저장

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

      <SignupModal
        open={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </div>
  );
}