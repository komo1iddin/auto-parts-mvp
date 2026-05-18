import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppRealtimeRefresh } from "@/components/realtime/AppRealtimeRefresh";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.role === "client") redirect("/catalog");

  return (
    <div className="flex h-dvh bg-background">
      <AppRealtimeRefresh />
      <Sidebar role="manager" userName={user.name} />
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto w-full max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
