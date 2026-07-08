import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AddProductFlow } from "@/components/products/add-product-flow";
import { auth } from "@/lib/auth";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user?.businessId) redirect("/login");

  return (
    <DashboardShell title="Add Product" eyebrow="Catalog management">
      <Link
        href="/dashboard/products"
        className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#607080] transition hover:text-[#060b1f]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <div className="max-w-6xl">
        <AddProductFlow />
      </div>
    </DashboardShell>
  );
}
