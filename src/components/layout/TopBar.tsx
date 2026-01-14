export default function TopBar() {
  return (
    <div className="h-14 w-full bg-white">
      <div className="flex h-full w-full items-center justify-end gap-4">
        <div className="h-8 w-8 rounded-full bg-gray-300" />
        <div className="text-sm text-gray-700">ㅇㅇㅇ님</div>
        <button className="h-8 rounded-full border border-gray-200 px-4 text-sm">
          로그아웃
        </button>
      </div>
    </div>
  );
}
