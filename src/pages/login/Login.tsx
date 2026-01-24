import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import LoginModal from "../../components/modal/LoginModal";
import StartModal from "../../components/modal/StartModal";
import HistoryModal from "../../components/modal/HistoryModal";

// 선택 고객 타입 import
import type { Customer } from "../../data/customersDummy";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // ✅ 선택된 고객(이름만 말고 전체를 저장)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ id, pw });
    setIsLoginModalOpen(true);
  };

  // LoginModal: "신규 고객 추가" 버튼
  const handleAddCustomer = () => {
    setIsLoginModalOpen(false);
    navigate("/step1/add-customer");
  };

  // ✅ LoginModal: 우측 화살표 → StartModal 열기 (+ 선택 고객 저장)
  const handleOpenStartModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLoginModalOpen(false);
    setIsStartModalOpen(true);
  };

  // ✅ StartModal: 이전 기록 열람하기 → HistoryModal 오픈
  const handleOpenHistoryModal = () => {
    if (!selectedCustomer) return;
    setIsStartModalOpen(false);
    setIsHistoryModalOpen(true);
  };

  // ✅ HistoryModal 닫기 → StartModal로 돌아가기(원하면 이 로직 바꿔도 됨)
  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
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

      {/* 1) 로그인 후 고객 선택 모달 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAddCustomer={handleAddCustomer}
        onOpenStartModal={handleOpenStartModal}
      />

      {/* 2) StartModal */}
      <StartModal
        open={isStartModalOpen}
        userName={selectedCustomer?.name ?? "OOO"}
        onClose={() => setIsStartModalOpen(false)}
        onLoadPrevious={handleOpenHistoryModal} // ✅ 연결!
        onStartNew={() => {
          setIsStartModalOpen(false);
          navigate("/step1/period");
        }}
      />

      {/* 3) HistoryModal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        customer={selectedCustomer}
        onStartNew={() => {
          setIsHistoryModalOpen(false);
          navigate("/step1/period");
        }}
      />
    </div>
  );
}
