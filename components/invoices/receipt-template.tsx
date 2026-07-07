import Image from "next/image";
import type { InvoicePrintData } from "@/lib/invoice-data";
import { formatMoney } from "@/lib/currency";

export function ReceiptTemplate({ invoice }: { invoice: InvoicePrintData }) {
  const currency = { code: invoice.currencyCode, symbol: invoice.currencySymbol, locale: invoice.currencyLocale };

  return (
    <div className="print-page mx-auto w-full max-w-sm rounded-[28px] border border-[#dfebf3] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="text-center">
        <Image src="/vision-pos-logo.png" alt="VisionPOS" width={170} height={54} className="mx-auto h-auto w-40 object-contain" />
        <h1 className="mt-4 text-xl font-semibold text-[#060b1f]">{invoice.businessName}</h1>
        <p className="text-xs font-semibold text-[#607080]">{invoice.storeName}{invoice.storeAddress ? ` · ${invoice.storeAddress}` : ""}</p>
      </div>
      <div className="my-5 border-y border-dashed border-[#cbd5e1] py-3 text-xs font-bold text-[#607080]">
        <div className="flex justify-between"><span>Invoice</span><span>{invoice.invoiceNumber}</span></div>
        <div className="mt-1 flex justify-between"><span>Date</span><span>{invoice.createdAt.toLocaleString()}</span></div>
        <div className="mt-1 flex justify-between"><span>Cashier</span><span>{invoice.cashierName}</span></div>
        <div className="mt-1 flex justify-between"><span>Payment</span><span>{invoice.paymentMethod.replaceAll("_", " ")}</span></div>
      </div>
      <div className="space-y-3">
        {invoice.items.map((item) => (
          <div key={`${item.sku}-${item.name}`} className="flex justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-[#060b1f]">{item.name}</p>
              <p className="text-xs font-bold text-[#607080]">{item.quantity} x {formatMoney(item.unitPrice, currency)}</p>
            </div>
            <strong>{formatMoney(item.lineTotal, currency)}</strong>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 border-t border-dashed border-[#cbd5e1] pt-4 text-sm font-bold text-[#607080]">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(invoice.subtotal, currency)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>-{formatMoney(invoice.discountAmount, currency)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatMoney(invoice.taxAmount, currency)}</span></div>
        <div className="flex justify-between text-xl font-semibold text-[#060b1f]"><span>Total</span><span>{formatMoney(invoice.totalAmount, currency)}</span></div>
      </div>
      <p className="mt-6 text-center text-xs font-bold text-[#607080]">{invoice.footer}</p>
    </div>
  );
}
