import Image from "next/image";
import { formatMoney } from "@/lib/currency";

const items = [
  { name: "Mineral Water 500ml", quantity: 2, price: 90 },
  { name: "Chocolate Bar", quantity: 1, price: 220 },
  { name: "Classic Chips", quantity: 2, price: 160 },
];

export function ReceiptTemplate() {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);

  return (
    <div className="print-page mx-auto w-full max-w-sm rounded-[28px] border border-[#dfebf3] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="text-center">
        <Image src="/vision-pos-logo.png" alt="VisionPOS" width={170} height={54} className="mx-auto h-auto w-40 object-contain" />
        <h1 className="mt-4 text-xl font-semibold text-[#060b1f]">Vision Mart</h1>
        <p className="text-xs font-semibold text-[#607080]">Main Store · Karachi</p>
      </div>
      <div className="my-5 border-y border-dashed border-[#cbd5e1] py-3 text-xs font-bold text-[#607080]">
        <div className="flex justify-between"><span>Invoice</span><span>VP-20260706-1142</span></div>
        <div className="mt-1 flex justify-between"><span>Cashier</span><span>Counter 1</span></div>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="flex justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-[#060b1f]">{item.name}</p>
              <p className="text-xs font-bold text-[#607080]">{item.quantity} x {formatMoney(item.price)}</p>
            </div>
            <strong>{formatMoney(item.price * item.quantity)}</strong>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 border-t border-dashed border-[#cbd5e1] pt-4 text-sm font-bold text-[#607080]">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatMoney(tax)}</span></div>
        <div className="flex justify-between text-xl font-semibold text-[#060b1f]"><span>Total</span><span>{formatMoney(subtotal + tax)}</span></div>
      </div>
      <p className="mt-6 text-center text-xs font-bold text-[#607080]">Thank you for shopping with us.</p>
    </div>
  );
}
