import Image from "next/image";
import { formatMoney } from "@/lib/currency";

const items = [
  { name: "Mineral Water 500ml", sku: "WTR-500", quantity: 2, price: 90 },
  { name: "Chocolate Bar", sku: "CHO-120", quantity: 1, price: 220 },
  { name: "Classic Chips", sku: "CHP-001", quantity: 2, price: 160 },
];

export function A4Template() {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);

  return (
    <div className="print-page mx-auto min-h-[980px] w-full max-w-4xl rounded-[28px] border border-[#dfebf3] bg-white p-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <header className="flex items-start justify-between gap-8 border-b border-[#dfebf3] pb-8">
        <div>
          <Image src="/vision-pos-logo.png" alt="VisionPOS" width={190} height={60} className="h-auto w-48 object-contain" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#607080]">Vision Mart, Main Store, Karachi. Phone: +92 300 0000000</p>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-semibold text-[#060b1f]">Invoice</h1>
          <p className="mt-2 font-bold text-[#607080]">VP-20260706-1142</p>
        </div>
      </header>
      <section className="my-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-[#f1f7fb] p-4"><p className="text-xs font-bold uppercase text-[#607080]">Date</p><p className="mt-1 font-semibold">06 Jul 2026</p></div>
        <div className="rounded-3xl bg-[#f1f7fb] p-4"><p className="text-xs font-bold uppercase text-[#607080]">Cashier</p><p className="mt-1 font-semibold">Counter 1</p></div>
        <div className="rounded-3xl bg-[#f1f7fb] p-4"><p className="text-xs font-bold uppercase text-[#607080]">Payment</p><p className="mt-1 font-semibold">Cash</p></div>
      </section>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-y border-[#dfebf3] text-xs uppercase tracking-[0.16em] text-[#607080]">
          <tr><th className="py-4">Item</th><th>SKU</th><th>Qty</th><th>Price</th><th className="text-right">Total</th></tr>
        </thead>
        <tbody className="divide-y divide-[#dfebf3]">
          {items.map((item) => (
            <tr key={item.sku}>
              <td className="py-5 font-semibold text-[#060b1f]">{item.name}</td>
              <td className="text-[#607080]">{item.sku}</td>
              <td>{item.quantity}</td>
              <td>{formatMoney(item.price)}</td>
              <td className="text-right font-semibold">{formatMoney(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="ml-auto mt-10 w-full max-w-sm space-y-3 rounded-[28px] bg-[#f1f7fb] p-6 font-bold text-[#607080]">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatMoney(tax)}</span></div>
        <div className="flex justify-between border-t border-[#dfebf3] pt-4 text-2xl font-semibold text-[#060b1f]"><span>Total</span><span>{formatMoney(subtotal + tax)}</span></div>
      </section>
    </div>
  );
}
