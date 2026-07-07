import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductActions } from "@/components/products/product-actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const session = await auth();

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
    <DashboardShell title="Product Catalog" eyebrow="Catalog management">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Products</CardTitle>
              <CardDescription>{products.length} product{products.length !== 1 ? "s" : ""} in your catalog.</CardDescription>
            </div>
            <Link href="/dashboard/products/new">
              <Button variant="gradient">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>
        </CardHeader>
        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#dfebf3] p-10 text-center">
            <p className="text-lg font-semibold text-[#060b1f]">No products yet</p>
            <p className="mt-2 text-sm text-[#607080]">Add your first product to start building your catalog.</p>
            <Link href="/dashboard/products/new" className="mt-4 inline-block">
              <Button variant="gradient">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#dfebf3]">
            <table className="w-full min-w-[820px] border-collapse bg-white text-left text-sm">
              <thead className="bg-[#f1f7fb] text-xs uppercase tracking-[0.16em] text-[#607080]">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Barcode</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Stock</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Vision</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dfebf3]">
                {products.map((product) => (
                  <tr key={product.id} className={product.isActive ? "" : "bg-[#fafbfc]"}>
                    <td className="px-5 py-4 font-semibold text-[#060b1f]">{product.name}</td>
                    <td className="px-5 py-4 text-[#607080]">{product.sku}</td>
                    <td className="px-5 py-4 font-mono text-xs text-[#607080]">{product.barcode || "—"}</td>
                    <td className="px-5 py-4"><Badge variant="blue">{product.category?.name || "Uncategorized"}</Badge></td>
                    <td className="px-5 py-4 font-bold text-[#060b1f]">Rs {Number(product.price).toLocaleString()}</td>
                    <td className="px-5 py-4 text-[#607080]">{product.inventory.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td className="px-5 py-4">
                      <Badge variant={product.isActive ? "green" : "neutral"}>
                        {product.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4"><Badge variant={product.visualProfile?.profileStatus === "READY" ? "green" : "neutral"}>{product.visualProfile?.profileStatus || "NOT_STARTED"}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="rounded-lg p-1.5 text-[#607080] transition hover:bg-[#f1f7fb] hover:text-[#060b1f]"
                          title="Edit product"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <ProductActions productId={product.id} isActive={product.isActive} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
