type TopBarProps = {
  userName?: string;
  onLogout?: () => void;
};

export default function TopBar({ userName = "OOO", onLogout }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b">
      <div className="h-full flex items-center justify-end gap-3 px-6">
        <div className="w-8 h-8 rounded-full bg-gray-300" />
        <span className="text-sm text-gray-800">{userName}님</span>
        <button
          type="button"
          onClick={onLogout}
          className="text-sm px-4 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
