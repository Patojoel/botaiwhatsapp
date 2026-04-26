import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative p-8">
        {children}
      </main>
    </div>
  );
}
