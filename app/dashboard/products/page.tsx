import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddProductFlow } from "@/components/products/add-product-flow";
import { ProductActions } from "@/components/products/product-actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const session = await auth();
  const { error } = await searchParams;

  if (!session?.user?.businessId) {
    redirect("/login");
  }

  const products = await prisma.product.findMany({
    where: { businessId: session.user.businessId },
    include: {
      category: true,
      inventory: true,
      visualProfile: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell title="Products" eyebrow="Catalog management">
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="grid gap-6">
          <AddProductFlow />
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Products from your Neon database.</CardDescription>
              </div>
            </CardHeader>
            {products.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#dfebf3] p-10 text-center">
                <p className="text-lg font-semibold text-[#060b1f]">No products yet</p>
                <p className="mt-2 text-sm text-[#607080]">Your account starts clean. Products and video profiles will appear here after admin entry.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-[#dfebf3]">
                <table className="w-full min-w-[760px] border-collapse bg-white text-left text-sm">
                  <thead className="bg-[#f1f7fb] text-xs uppercase tracking-[0.16em] text-[#607080]">
                    <tr>
                      <th className="px-5 py-4">Product</th>
                      <th className="px-5 py-4">SKU</th>
                      <th className="px-5 py-4">Barcode</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Stock</th>
                      <th className="px-5 py-4">Vision</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dfebf3]">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-5 py-4 font-semibold text-[#060b1f]">{product.name}</td>
                        <td className="px-5 py-4 text-[#607080]">{product.sku}</td>
                        <td className="px-5 py-4 font-mono text-xs text-[#607080]">{product.barcode || "—"}</td>
                        <td className="px-5 py-4"><Badge variant="blue">{product.category?.name || "Uncategorized"}</Badge></td>
                        <td className="px-5 py-4 font-bold text-[#060b1f]">Rs {Number(product.price).toLocaleString()}</td>
                        <td className="px-5 py-4 text-[#607080]">{product.inventory.reduce((sum, item) => sum + item.quantity, 0)}</td>
                        <td className="px-5 py-4"><Badge variant={product.visualProfile?.profileStatus === "READY" ? "green" : "neutral"}>{product.visualProfile?.profileStatus || "NOT_STARTED"}</Badge></td>
                        <td className="px-5 py-4">
                          <ProductActions productId={product.id} isActive={product.isActive} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
