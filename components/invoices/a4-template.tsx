import type { InvoicePrintData } from "@/lib/invoice-data";
import { formatMoney } from "@/lib/currency";

export function A4Template({ invoice }: { invoice: InvoicePrintData }) {
  const currency = { code: invoice.currencyCode, symbol: invoice.currencySymbol, locale: invoice.currencyLocale };

  return (
    <div className="print-page mx-auto min-h-[980px] w-full max-w-4xl rounded-[28px] border border-[#dfebf3] bg-white p-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <header className="flex items-start justify-between gap-8 border-b border-[#dfebf3] pb-8">
        <div>
          <img src={invoice.logoUrl || "/vision-pos-logo.png"} alt={`${invoice.businessName} logo`} className="max-h-20 w-48 object-contain" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#607080]">
            {invoice.businessName}, {invoice.storeName}{invoice.businessAddress ? `, ${invoice.businessAddress}` : ""}{invoice.businessPhone ? `. Phone: ${invoice.businessPhone}` : ""}
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-semibold text-[#060b1f]">Invoice</h1>
          <p className="mt-2 font-bold text-[#607080]">{invoice.invoiceNumber}</p>
        </div>
      </header>
      <section className="my-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-[#f1f7fb] p-4"><p className="text-xs font-bold uppercase text-[#607080]">Date</p><p className="mt-1 font-semibold">{invoice.createdAt.toLocaleString()}</p></div>
        <div className="rounded-3xl bg-[#f1f7fb] p-4"><p className="text-xs font-bold uppercase text-[#607080]">Cashier</p><p className="mt-1 font-semibold">{invoice.cashierName}</p></div>
        <div className="rounded-3xl bg-[#f1f7fb] p-4"><p className="text-xs font-bold uppercase text-[#607080]">Payment</p><p className="mt-1 font-semibold">{invoice.paymentMethod.replaceAll("_", " ")}</p></div>
      </section>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-y border-[#dfebf3] text-xs uppercase tracking-[0.16em] text-[#607080]">
          <tr><th className="py-4">Item</th><th>SKU</th><th>Qty</th><th>Price</th><th className="text-right">Total</th></tr>
        </thead>
        <tbody className="divide-y divide-[#dfebf3]">
          {invoice.items.map((item) => (
            <tr key={`${item.sku}-${item.name}`}>
              <td className="py-5 font-semibold text-[#060b1f]">{item.name}</td>
              <td className="text-[#607080]">{item.sku}</td>
              <td>{item.quantity}</td>
              <td>{formatMoney(item.unitPrice, currency)}</td>
              <td className="text-right font-semibold">{formatMoney(item.lineTotal, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="ml-auto mt-10 w-full max-w-sm space-y-3 rounded-[28px] bg-[#f1f7fb] p-6 font-bold text-[#607080]">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(invoice.subtotal, currency)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>-{formatMoney(invoice.discountAmount, currency)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatMoney(invoice.taxAmount, currency)}</span></div>
        <div className="flex justify-between border-t border-[#dfebf3] pt-4 text-2xl font-semibold text-[#060b1f]"><span>Total</span><span>{formatMoney(invoice.totalAmount, currency)}</span></div>
        {invoice.paymentMethod === "CASH" && (
          <>
            <div className="flex justify-between"><span>Cash received</span><span>{formatMoney(invoice.amountTendered, currency)}</span></div>
            <div className="flex justify-between text-base font-semibold text-emerald-700"><span>Change due</span><span>{formatMoney(invoice.changeDue, currency)}</span></div>
          </>
        )}
      </section>
      <p className="mt-10 text-center text-sm font-bold text-[#607080]">{invoice.footer}</p>
      <div className="mt-5 border-t border-[#dfebf3] pt-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#9aa8b5]">
        Powered by VisionPOS
      </div>
    </div>
  );
}
