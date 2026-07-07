import { PackageSearch, ReceiptText, TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.businessId) {
    redirect("/login");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [salesToday, productsCount, lowStockCount, recentSales, settings] = await Promise.all([
    prisma.sale.findMany({ where: { businessId: session.user.businessId, createdAt: { gte: startOfDay } } }),
    prisma.product.count({ where: { businessId: session.user.businessId } }),
    prisma.inventory.count({ where: { businessId: session.user.businessId, quantity: { lte: 5 } } }),
    prisma.sale.findMany({
      where: { businessId: session.user.businessId },
      include: { cashier: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.businessSettings.findUnique({ where: { businessId: session.user.businessId } }),
  ]);

  const revenueToday = salesToday.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const currencySymbol = settings?.currencySymbol || "Rs";

  const metrics = [
    { label: "Today's Revenue", value: `${currencySymbol} ${revenueToday.toLocaleString()}`, delta: "Live Neon data", tone: "blue" },
    { label: "Sales Today", value: String(salesToday.length), delta: "Completed", tone: "green" },
    { label: "Low Stock", value: String(lowStockCount), delta: "Needs action", tone: "warning" },
    { label: "Active Products", value: String(productsCount), delta: "Catalog", tone: "violet" },
  ] as const;

  const toneToBadge = {
    blue: "blue",
    green: "green",
    warning: "warning",
    violet: "violet",
  } as const;

  return (
    <DashboardShell title="Control Center" eyebrow="Owner workspace">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm font-bold text-[#607080]">{metric.label}</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <strong className="text-3xl font-semibold tracking-tight text-[#060b1f]">{metric.value}</strong>
              <Badge variant={toneToBadge[metric.tone]}>{metric.delta}</Badge>
            </div>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Real transactions from your Neon database.</CardDescription>
            </div>
            <Badge variant="green">Synced</Badge>
          </CardHeader>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#dfebf3] p-8 text-center text-sm font-medium text-[#607080]">No sales yet.</div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-4 rounded-3xl border border-[#dfebf3] p-4">
                  <div>
                    <p className="font-semibold text-[#060b1f]">{sale.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-[#607080]">{sale.items.length} items · {sale.cashier.name || sale.cashier.email}</p>
                  </div>
                  <p className="font-semibold text-[#060b1f]">{sale.currencySymbol} {Number(sale.totalAmount).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="vision-gradient text-white">
          <div className="flex h-full flex-col justify-between gap-8">
            <div>
              <Badge variant="dark" className="bg-white/18 text-white">Browser vision</Badge>
              <h2 className="mt-5 text-3xl font-semibold leading-tight">No installation needed.</h2>
              <p className="mt-4 leading-7 text-white/80">Barcode scanning and visual matching run entirely in the browser. Zero downloads, zero setup.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-white/16 p-4"><PackageSearch className="mb-3 h-6 w-6" /><p className="text-sm font-bold">Barcode</p></div>
              <div className="rounded-3xl bg-white/16 p-4"><ReceiptText className="mb-3 h-6 w-6" /><p className="text-sm font-bold">Invoices</p></div>
              <div className="rounded-3xl bg-white/16 p-4"><TriangleAlert className="mb-3 h-6 w-6" /><p className="text-sm font-bold">Stock</p></div>
            </div>
          </div>
        </Card>
      </section>
    </DashboardShell>
  );
}
