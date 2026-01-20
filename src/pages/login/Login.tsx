import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import LoginModal from "../../components/modal/LoginModal";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔹 실제 로그인 로직은 나중에
    console.log({ id, pw });

    // 🔹 지금은 로그인 성공 가정 → 모달 오픈
    setIsModalOpen(true);
  };

  const handleAddCustomer = () => {
    setIsModalOpen(false);
    navigate("/step1/add-customer");
  };

  return (
    <div className={styles.wrapper}>
      {/* 파란 반원 배경 */}
      <div className={styles.blueArc} />

      {/* 실제 콘텐츠 */}
      <div className={styles.container}>
        <div className={styles.title}>Log In</div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <div className={styles.label}>아이디</div>
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

          {/* 로그인 버튼 */}
          <button className={styles.button} type="submit">
            로그인하기
          </button>

          <div className={styles.links}>
            <button type="button" className={styles.link}>
              아이디 / 비밀번호 찾기
            </button>
            <button type="button" className={styles.link}>
              회원가입
            </button>
          </div>
        </form>
      </div>

      {/* 로그인 후 고객 선택 모달 */}
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCustomer={handleAddCustomer}
      />
    </div>
  );
}
