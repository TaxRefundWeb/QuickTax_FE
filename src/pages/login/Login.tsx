import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import LoginModal from "../../components/modal/LoginModal";
import StartModal from "../../components/modal/StartModal";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: 실제 로그인 로직은 나중에 서버 연동
    console.log({ id, pw });

    // 지금은 로그인 성공 가정 → LoginModal 오픈
    setIsLoginModalOpen(true);
  };

  // LoginModal: "신규 고객 추가" 버튼
  const handleAddCustomer = () => {
    setIsLoginModalOpen(false);
    navigate("/step1/add-customer");
  };

  // ✅ LoginModal: 임시 버튼 → StartModal 열기
  const handleOpenStartModal = () => {
    setIsLoginModalOpen(false);
    setIsStartModalOpen(true);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.blueArc} />
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
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAddCustomer={handleAddCustomer}
        onOpenStartModal={handleOpenStartModal}
      />

      {/* StartModal */}
      <StartModal
        open={isStartModalOpen}
        userName="OOO"
        onClose={() => setIsStartModalOpen(false)}
        onLoadPrevious={() => {
          console.log("이전 기록 불러오기");
        }}
        onStartNew={() => {
          setIsStartModalOpen(false);
          navigate("/step1/existing");
        }}
      />
    </div>
  );
}
