import { useNavigate } from "react-router-dom";
import { useCustomerListModal } from "../../contexts/customerListModalContext";
import { logout } from "../../lib/api/auth";

export default function TopBar() {
  const navigate = useNavigate();
  const { openLoginModal } = useCustomerListModal();

  const handleLogout = async () => {
    try {
      await logout(); // 서버에 로그아웃 요청 (쿠키 삭제)
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      sessionStorage.removeItem("customerId");
      sessionStorage.removeItem("caseId");
      // 필요하면 여기서 더 제거

      navigate("/", { replace: true });
    }
  };

  return (
    <header className="h-14 w-full border-b bg-white">
      <div className="mx-auto flex h-full max-w-[1152px] items-center justify-end px-6">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openLoginModal}
            className={[
              "rounded-full border border-gray-200",
              "px-3 py-1 text-sm text-gray-600",
              "hover:bg-gray-50",
            ].join(" ")}
          >
            고객 목록
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="ml-2 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}