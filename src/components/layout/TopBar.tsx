import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 🔹 나중에 인증 붙이면 여기서 토큰 제거
    // localStorage.removeItem("token");

    navigate("/", { replace: true });
  };

  return (
    <header className="h-14 w-full border-b bg-white">
      <div className="mx-auto flex h-full max-w-[1152px] items-center justify-end px-6">
        <div className="flex items-center gap-1">

          <button
            type="button"
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