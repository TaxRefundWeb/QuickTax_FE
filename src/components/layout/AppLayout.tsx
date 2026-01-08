import TopBar from "./TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      <TopBar userName="OOO" onLogout={() => console.log("logout")} />
      {children}
    </div>
  );
}
