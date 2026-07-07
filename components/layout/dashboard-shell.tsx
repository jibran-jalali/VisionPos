import { Bell, LogOut, Search } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";

export async function DashboardShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  const session = await auth();
  const userName = session?.user?.name || "Admin";
  const userEmail = session?.user?.email || "admin@visionpos";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
        <header className="mb-8 flex flex-col gap-5 rounded-[32px] border border-[#dfebf3] bg-white/88 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div>
            {eyebrow ? <Badge variant="blue">{eyebrow}</Badge> : null}
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#060b1f] md:text-4xl">{title}</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa8b5]" />
              <Input className="pl-11" placeholder="Search products, invoices, stock..." />
            </div>
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dfebf3] bg-white text-[#607080]" type="button">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 rounded-full border border-[#dfebf3] bg-white px-3 py-2 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6ff] text-sm font-semibold text-[#060b1f]">
                {initial}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-[#060b1f]">{userName}</p>
                <p className="truncate text-xs font-medium text-[#607080]">{userEmail}</p>
              </div>
              <form action={logoutAction}>
                <button className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#607080] transition hover:bg-[#f1f7fb] hover:text-[#060b1f]" type="submit">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
