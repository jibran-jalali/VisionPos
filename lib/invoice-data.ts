import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type InvoicePrintData = {
  businessName: string;
  businessPhone: string | null;
  businessAddress: string | null;
  storeName: string;
  storeAddress: string | null;
  invoiceNumber: string;
  createdAt: Date;
  cashierName: string;
  paymentMethod: string;
  currencyCode: string;
  currencySymbol: string;
  currencyLocale: string;
  footer: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  items: {
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

export async function getInvoicePrintData(invoiceId: string, businessId: string): Promise<InvoicePrintData> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: {
      business: { include: { settings: true } },
      store: true,
      sale: {
        include: {
          cashier: true,
          items: true,
        },
      },
    },
  });

  if (!invoice) notFound();

  return {
    businessName: invoice.business.name,
    businessPhone: invoice.business.phone,
    businessAddress: invoice.business.address,
    storeName: invoice.store.name,
    storeAddress: invoice.store.address,
    invoiceNumber: invoice.invoiceNumber,
    createdAt: invoice.createdAt,
    cashierName: invoice.sale.cashier.name || invoice.sale.cashier.email,
    paymentMethod: invoice.sale.paymentMethod,
    currencyCode: invoice.sale.currencyCode,
    currencySymbol: invoice.sale.currencySymbol,
    currencyLocale: invoice.business.settings?.currencyLocale || "en-PK",
    footer: invoice.business.settings?.invoiceFooter || "Thank you for shopping with us.",
    subtotal: Number(invoice.sale.subtotal),
    discountAmount: Number(invoice.sale.discountAmount),
    taxAmount: Number(invoice.sale.taxAmount),
    totalAmount: Number(invoice.sale.totalAmount),
    items: invoice.sale.items.map((item) => ({
      name: item.productNameSnapshot,
      sku: item.skuSnapshot,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}
