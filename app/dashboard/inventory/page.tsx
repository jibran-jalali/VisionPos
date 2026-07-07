import { Boxes, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restockProductAction } from "./actions";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ error?: string; restocked?: string }> }) {
  const session = await auth();
  const { error, restocked } = await searchParams;

  if (!session?.user?.businessId) {
    redirect("/login");
  }

  const inventory = await prisma.inventory.findMany({
    where: { businessId: session.user.businessId },
    include: { product: true, store: true },
    orderBy: { updatedAt: "desc" },
  });

  const products = await prisma.product.findMany({
    where: { businessId: session.user.businessId, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <DashboardShell title="Inventory" eyebrow="Stock control">
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Restock Product</CardTitle>
            <CardDescription>Add stock to an existing product. No packaging video needed.</CardDescription>
          </div>
        </CardHeader>
        {restocked ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Inventory updated.</div> : null}
        {error ? <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Could not update inventory.</div> : null}
        <form action={restockProductAction} className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Product</label>
            <select name="productId" required className="min-h-12 w-full rounded-2xl border border-[#dfebf3] bg-white px-4 text-sm text-[#060b1f] outline-none transition focus:border-[#15bdf2] focus:ring-4 focus:ring-sky-100">
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Quantity to add</label>
            <Input name="quantity" type="number" min="1" step="1" placeholder="25" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Reason</label>
            <Input name="reason" placeholder="New stock purchase" />
          </div>
          <Button variant="gradient" type="submit"><Plus className="mr-2 h-4 w-4" /> Add stock</Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Stock Overview</CardTitle>
            <CardDescription>Restocking updates inventory only. Product videos are not re-uploaded for stock changes.</CardDescription>
          </div>
        </CardHeader>
        {inventory.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#dfebf3] p-10 text-center">
            <p className="text-lg font-semibold text-[#060b1f]">No inventory yet</p>
            <p className="mt-2 text-sm text-[#607080]">Create products and stock entries to start selling from checkout.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {inventory.map((item) => (
              <div key={item.id} className="rounded-[28px] border border-[#dfebf3] bg-[#fbfdff] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#060b1f]">{item.product.name}</p>
                    <p className="mt-1 text-sm text-[#607080]">{item.product.sku} · {item.store.name}</p>
                  </div>
                  <Boxes className="h-5 w-5 text-[#0284c7]" />
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#607080]">Current stock</p>
                    <p className="mt-1 text-4xl font-semibold text-[#060b1f]">{item.quantity}</p>
                  </div>
                  <Badge variant={item.quantity <= item.reorderLevel ? "warning" : "green"}>{item.quantity <= item.reorderLevel ? "Low" : "Healthy"}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      </div>
    </DashboardShell>
  );
}
