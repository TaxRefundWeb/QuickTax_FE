import TopBar from "./TopBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white">
      <TopBar />
      {children}
    </div>
  );
}
