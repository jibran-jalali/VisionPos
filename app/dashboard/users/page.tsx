import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCashierAction } from "./actions";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const session = await auth();
  const { error, created } = await searchParams;

  if (!session?.user?.businessId) {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    where: { businessId: session.user.businessId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <DashboardShell title="Users" eyebrow="Roles and subaccounts">
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Create Cashier</CardTitle>
              <CardDescription>Cashiers cannot register themselves. Admins create counter accounts here.</CardDescription>
            </div>
          </CardHeader>
          {created ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Cashier created.</div> : null}
          {error ? <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Could not create cashier. Check the details.</div> : null}
          <form action={createCashierAction} className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#060b1f]">Cashier name</label>
              <Input name="name" placeholder="Counter 1" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#060b1f]">Cashier email</label>
              <Input name="email" type="email" placeholder="cashier@store.com" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#060b1f]">Temporary password</label>
              <Input name="password" type="password" placeholder="Minimum 8 characters" required minLength={8} />
            </div>
            <Button variant="gradient" type="submit">Create cashier login</Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Team Access</CardTitle>
              <CardDescription>Real users from your Neon database.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4">
            {users.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#dfebf3] p-8 text-center text-sm font-medium text-[#607080]">No users found.</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex flex-col gap-4 rounded-3xl border border-[#dfebf3] p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[#060b1f]">{user.name || "Unnamed user"}</p>
                    <p className="mt-1 text-sm text-[#607080]">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === "OWNER" ? "dark" : user.role === "CASHIER" ? "green" : "blue"}>{user.role}</Badge>
                    <span className="text-sm font-bold text-[#607080]">{user.isActive ? "Active" : "Disabled"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
