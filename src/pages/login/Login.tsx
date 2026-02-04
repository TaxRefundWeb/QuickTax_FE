import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

import FindAccountModal from "../../components/modal/FindAccountModal";
import LoginFailModal from "../../components/modal/LoginFailModal"; // ✅ 추가
import LoginModal from "../../components/modal/LoginModal";
import StartModal from "../../components/modal/StartModal";
import HistoryModal from "../../components/modal/HistoryModal";

import type { Customer } from "../../lib/api/customers";

// 로그인 API
import { login } from "../../lib/api/auth";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // 아이디/비밀번호 찾기 안내 모달
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);

  // ✅ 로그인 실패 모달
  const [isLoginFailOpen, setIsLoginFailOpen] = useState(false);

  // 선택된 고객(이름만 말고 전체를 저장)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // 로그인 진행 상태(중복 클릭 방지)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ 기존 alert 대신 로그인 실패 모달로 통일
    if (!id || !pw) {
      setIsLoginFailOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // 백엔드: POST /api/auth/login  (쿠키 accessToken 발급)
      await login(id, pw);

      // 로그인 성공 시에만 고객 선택 모달 열기
      setIsLoginModalOpen(true);
    } catch (err) {
      console.error(err);
      setIsLoginFailOpen(true); // ✅ 기존 alert 대신 모달
    } finally {
      setIsSubmitting(false);
    }
  };

  // LoginModal: "신규 고객 추가" 버튼
  const handleAddCustomer = () => {
    setIsLoginModalOpen(false);
    navigate("/step1/add-customer");
  };

  // LoginModal: 우측 화살표 → StartModal 열기 (+ 선택 고객 저장)
  const handleOpenStartModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLoginModalOpen(false);
    setIsStartModalOpen(true);
  };

  // StartModal: 이전 기록 열람하기 → HistoryModal 오픈
  const handleOpenHistoryModal = () => {
    if (!selectedCustomer) return;
    setIsStartModalOpen(false);
    setIsHistoryModalOpen(true);
  };

  // HistoryModal 닫기 → StartModal로 돌아가기
  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setIsStartModalOpen(true);
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

      {/* ✅ 아이디/비밀번호 찾기 안내 모달 */}
      <FindAccountModal
        open={isFindModalOpen}
        onClose={() => setIsFindModalOpen(false)}
      />

      {/* ✅ 로그인 실패 모달 */}
      <LoginFailModal
        open={isLoginFailOpen}
        onClose={() => setIsLoginFailOpen(false)}
      />

      {/* 1) 로그인 후 고객 선택 모달 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAddCustomer={handleAddCustomer}
        onOpenStartModal={handleOpenStartModal}
        closeOnBackdropClick={false}
        closeOnEsc={false}
      />

      {/* 2) StartModal */}
      <StartModal
        open={isStartModalOpen}
        userName={selectedCustomer?.name ?? "OOO"}
        onClose={() => setIsStartModalOpen(false)}
        onLoadPrevious={handleOpenHistoryModal}
        onBack={() => {
          setIsStartModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onStartNew={() => {
          if (!selectedCustomer) return;

          setIsStartModalOpen(false);
          navigate("/step1/confirm", {
            state: { customerId: selectedCustomer.customerId },
          });
        }}
      />

      {/* 3) HistoryModal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        customer={selectedCustomer}
        onStartNew={() => {
          if (!selectedCustomer) return;

          setIsHistoryModalOpen(false);
          navigate("/step1/confirm", {
            state: { customerId: selectedCustomer.customerId },
          });
        }}
      />
    </div>
  );
}
