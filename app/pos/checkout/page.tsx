import { redirect } from "next/navigation";
import { CheckoutConsole, type CheckoutProduct } from "@/components/pos/checkout-console";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const productColors = ["#15BDF2", "#6F35F5", "#8DF0B1", "#F59E0B", "#EF4444"];

export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user?.businessId) {
    redirect("/cashier/login");
  }

  const [products, settings] = await prisma.$transaction([
    prisma.product.findMany({
      where: { businessId: session.user.businessId, isActive: true },
      include: {
        category: true,
        inventory: true,
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.businessSettings.findUnique({ where: { businessId: session.user.businessId } }),
  ]);

  const checkoutProducts: CheckoutProduct[] = products.map((product, index) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    price: Number(product.price),
    stock: product.inventory.reduce((sum, item) => sum + item.quantity, 0),
    category: product.category?.name || "Uncategorized",
    color: productColors[index % productColors.length],
    variants: product.variants.map((v) => ({ id: v.id, name: v.name, priceAdj: Number(v.priceAdj) })),
  }));

  return (
    <CheckoutConsole
      products={checkoutProducts}
      cashierName={session.user.name || session.user.email || "Cashier"}
      visionEnabled={settings?.visionEnabled ?? true}
      autoPrint={settings?.autoPrint ?? false}
      taxEnabled={settings?.taxEnabled ?? false}
      taxRate={settings?.taxRate ? Number(settings.taxRate) : 0}
      currencySymbol={settings?.currencySymbol || "Rs"}
    />
  );
}
