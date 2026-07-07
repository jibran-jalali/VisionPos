"use client";

import { Minus, Plus, Printer, Search, Trash2, Wifi } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CameraScanner } from "@/components/pos/camera-scanner";
import { InvoicePopup } from "@/components/pos/invoice-popup";
import { formatMoney } from "@/lib/currency";
import type { InvoicePrintData } from "@/lib/invoice-data";

export type CheckoutProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  category: string;
  color: string;
  variants: { id: string; name: string; priceAdj: number }[];
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variantName?: string;
  cartKey: string;
};

type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_WALLET" | "OTHER";
type InvoiceFormat = "RECEIPT" | "A4";

const paymentMethods: { value: PaymentMethod; label: string; helper: string }[] = [
  { value: "CASH", label: "Cash", helper: "Customer paid cash" },
  { value: "CARD", label: "Card", helper: "Debit / credit card" },
  { value: "MOBILE_WALLET", label: "Wallet", helper: "JazzCash / Easypaisa" },
  { value: "BANK_TRANSFER", label: "Bank", helper: "Bank transfer" },
];

export function CheckoutConsole({ products, cashierName }: { products: CheckoutProduct[]; cashierName: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutError, setCheckoutError] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [invoiceFormat, setInvoiceFormat] = useState<InvoiceFormat>("RECEIPT");
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [invoicePreviewData, setInvoicePreviewData] = useState<InvoicePrintData | null>(null);
  const [sizePickerProduct, setSizePickerProduct] = useState<CheckoutProduct | null>(null);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discount = subtotal > 1000 ? 100 : 0;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + tax;

  function addToCart(product: CheckoutProduct, variant?: { name: string; priceAdj: number }) {
    setShowInvoicePopup(false);
    setInvoicePreviewData(null);
    setCheckoutError("");
    setCart((current) => {
      const cartKey = variant ? `${product.id}-${variant.name}` : product.id;
      const existing = current.find((item) => item.cartKey === cartKey);

      if (existing) {
        return current.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...current, {
        id: product.id,
        name: variant ? `${product.name} - ${variant.name}` : product.name,
        price: product.price + (variant?.priceAdj ?? 0),
        quantity: 1,
        variantName: variant?.name,
        cartKey,
      }];
    });
  }

  function addOrPickSize(product: CheckoutProduct) {
    if (product.variants.length > 0) {
      setSizePickerProduct(product);
    } else {
      addToCart(product);
    }
  }

  function updateQuantity(cartKey: string, amount: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + amount } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function openPayment(format: InvoiceFormat = "RECEIPT") {
    if (cart.length === 0 || isCompleting) return;
    setInvoiceFormat(format);
    setPaymentOpen(true);
    setCheckoutError("");
  }

  async function completeSale() {
    if (cart.length === 0 || isCompleting) return;
    setCheckoutError("");
    setIsCompleting(true);

    try {
      const res = await fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceFormat,
          paymentMethod,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            variantName: item.variantName,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Could not complete sale.");
        return;
      }

      if (!data.invoiceId) {
        setCheckoutError("Sale saved but invoice could not be generated. Check with admin.");
        return;
      }

      setCart([]);
      setPaymentOpen(false);
      setInvoicePreviewData(data.invoiceData);
      setShowInvoicePopup(true);
    } catch {
      setCheckoutError("Could not complete sale. Check your connection.");
    } finally {
      setIsCompleting(false);
    }
  }

  function handleNextCustomer() {
    setShowInvoicePopup(false);
    setInvoicePreviewData(null);
    setCheckoutError("");
  }

  return (
    <div className="grid min-h-screen gap-5 bg-[#f8fbff] p-4 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_500px]">
      <section className="flex min-w-0 flex-col rounded-[36px] border border-[#dfebf3] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Badge variant="green"><Wifi className="mr-1 h-3.5 w-3.5" /> Online counter</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#060b1f]">Main Store Checkout</h1>
          </div>
          <div className="relative xl:w-96">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa8b5]" />
            <Input className="min-h-14 rounded-3xl pl-12 text-base" placeholder="Search or scan product..." />
          </div>
        </header>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm font-bold text-[#607080]">Camera Checkout</p>
            <p className="mt-2 text-xl font-semibold text-[#060b1f]">Vision + Barcode</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-bold text-[#607080]">Invoice Mode</p>
            <p className="mt-2 text-xl font-semibold text-[#060b1f]">Receipt + A4</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-bold text-[#607080]">Cashier</p>
            <p className="mt-2 text-xl font-semibold text-[#060b1f]">{cashierName}</p>
          </Card>
        </div>

        <CameraScanner products={products} onProductMatched={addOrPickSize} />

        {products.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-[32px] border border-dashed border-[#dfebf3] bg-[#fbfdff] p-10 text-center">
            <div>
              <p className="text-xl font-semibold text-[#060b1f]">No products available</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#607080]">Ask an admin to add products and stock before using checkout.</p>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addOrPickSize(product)}
              disabled={product.stock <= 0}
              className="group flex min-h-44 flex-col justify-between rounded-[30px] border border-[#dfebf3] bg-[#fbfdff] p-5 text-left transition hover:-translate-y-1 hover:border-[#15bdf2] hover:shadow-[0_18px_42px_rgba(21,189,242,0.14)]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-3xl text-lg font-semibold text-white" style={{ background: product.color }}>
                {product.name.slice(0, 2).toUpperCase()}
              </span>
              <span>
                <span className="block font-semibold leading-tight text-[#060b1f]">{product.name}</span>
                <span className="mt-2 block text-sm font-bold text-[#607080]">{product.sku} · Stock {product.stock}</span>
                <span className="mt-3 block text-xl font-semibold text-[#0284c7]">{formatMoney(product.price)}</span>
              </span>
            </button>
          ))}
          </div>
        )}
      </section>

      <aside className="flex min-h-[700px] flex-col rounded-[36px] border border-[#dfebf3] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <Badge variant="blue">Current cart</Badge>
            <h2 className="mt-3 text-3xl font-semibold text-[#060b1f]">Checkout</h2>
          </div>
          <Button variant="soft" size="sm" onClick={() => setCart([])}>Clear</Button>
        </div>

        <div className="flex-1 space-y-3 overflow-auto pr-1">
          {cart.map((item) => (
            <div key={item.cartKey} className="rounded-[28px] border border-[#dfebf3] bg-[#fbfdff] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-tight text-[#060b1f]">{item.name}</p>
                  <p className="mt-1 text-sm font-bold text-[#607080]">{formatMoney(item.price)} each</p>
                </div>
                <button onClick={() => updateQuantity(item.cartKey, -item.quantity)} className="rounded-2xl p-2 text-[#ef4444] hover:bg-red-50">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.cartKey, -1)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#060b1f] ring-1 ring-[#dfebf3]"><Minus className="h-4 w-4" /></button>
                  <span className="flex h-11 min-w-12 items-center justify-center rounded-2xl bg-[#060b1f] px-4 font-semibold text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartKey, 1)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#060b1f] ring-1 ring-[#dfebf3]"><Plus className="h-4 w-4" /></button>
                </div>
                <strong className="text-xl text-[#060b1f]">{formatMoney(item.price * item.quantity)}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[30px] bg-[#f1f7fb] p-5">
          <div className="space-y-3 text-sm font-bold text-[#607080]">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatMoney(discount)}</span></div>
            <div className="flex justify-between"><span>Tax 5%</span><span>{formatMoney(tax)}</span></div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#dfebf3] pt-5">
            <span className="text-lg font-semibold text-[#060b1f]">Total</span>
            <strong className="text-4xl font-semibold text-[#060b1f]">{formatMoney(total)}</strong>
          </div>
        </div>

        {checkoutError && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {checkoutError}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button size="touch" variant="soft" onClick={() => openPayment("RECEIPT")} disabled={cart.length === 0 || isCompleting}>
            <Printer className="mr-2 h-5 w-5" /> Receipt
          </Button>
          <Button size="touch" variant="gradient" onClick={() => openPayment("RECEIPT")} disabled={cart.length === 0 || isCompleting}>
            Complete Sale
          </Button>
          <Button className="col-span-2" size="lg" variant="soft" onClick={() => openPayment("A4")} disabled={cart.length === 0 || isCompleting}>
            A4 Invoice
          </Button>
        </div>
      </aside>

      {paymentOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#060b1f]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-[#dfebf3] bg-white p-6 shadow-[0_32px_90px_rgba(6,11,31,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="blue">Payment</Badge>
                <h3 className="mt-3 text-2xl font-semibold text-[#060b1f]">Select payment method</h3>
                <p className="mt-1 text-sm font-medium text-[#607080]">Mark the order paid before storing the transaction.</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                disabled={isCompleting}
                className="rounded-2xl px-3 py-2 text-sm font-bold text-[#607080] hover:bg-[#f1f7fb]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-[24px] bg-[#f1f7fb] p-4">
              <div className="flex justify-between text-sm font-bold text-[#607080]"><span>Items</span><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
              <div className="mt-2 flex justify-between text-sm font-bold text-[#607080]"><span>Invoice</span><span>{invoiceFormat === "A4" ? "A4" : "Receipt"}</span></div>
              <div className="mt-4 flex items-center justify-between border-t border-[#dfebf3] pt-4">
                <span className="text-base font-semibold text-[#060b1f]">Amount due</span>
                <strong className="text-3xl font-semibold text-[#060b1f]">{formatMoney(total)}</strong>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  disabled={isCompleting}
                  className={`rounded-[22px] border p-4 text-left transition ${paymentMethod === method.value ? "border-[#15bdf2] bg-[#eef9ff] shadow-[0_16px_34px_rgba(21,189,242,0.16)]" : "border-[#dfebf3] bg-[#fbfdff] hover:border-[#15bdf2]"}`}
                >
                  <span className="block font-semibold text-[#060b1f]">{method.label}</span>
                  <span className="mt-1 block text-xs font-medium text-[#607080]">{method.helper}</span>
                </button>
              ))}
            </div>

            {checkoutError && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{checkoutError}</div>}

            <Button className="mt-5 w-full" size="touch" variant="gradient" onClick={completeSale} disabled={isCompleting}>
              {isCompleting ? "Saving paid transaction..." : `Mark Paid (${paymentMethods.find((method) => method.value === paymentMethod)?.label})`}
            </Button>
          </div>
        </div>
      )}

      {showInvoicePopup && invoicePreviewData && (
        <InvoicePopup invoiceData={invoicePreviewData} onNext={handleNextCustomer} />
      )}

      {sizePickerProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSizePickerProduct(null)}>
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-semibold text-[#060b1f]">Select size for {sizePickerProduct.name}</p>
            <div className="mt-5 space-y-2">
              {sizePickerProduct.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { addToCart(sizePickerProduct, v); setSizePickerProduct(null); }}
                  className="flex w-full items-center justify-between rounded-[20px] border border-[#dfebf3] px-5 py-4 text-left transition hover:border-[#15bdf2] hover:shadow-[0_6px_18px_rgba(21,189,242,0.12)]"
                >
                  <span className="font-semibold text-[#060b1f]">{v.name}</span>
                  <span className="text-sm font-bold text-[#607080]">{formatMoney(sizePickerProduct.price + v.priceAdj)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setSizePickerProduct(null)} className="mt-5 w-full rounded-[20px] py-3 text-center text-sm font-semibold text-[#607080] hover:bg-[#f1f7fb]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
