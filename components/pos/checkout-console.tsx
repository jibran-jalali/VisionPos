"use client";

import { motion, AnimatePresence } from "motion/react";
import { Plus, Printer, Search, Trash2, Wifi } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { CameraScanner } from "@/components/pos/camera-scanner";
import { InvoicePopup } from "@/components/pos/invoice-popup";
import { formatMoney } from "@/lib/currency";
import { isPrinterConnected, printReceipt } from "@/lib/escpos-printer";
import { buildReceiptLines } from "@/lib/receipt-builder";
import type { InvoicePrintData } from "@/lib/invoice-data";

const CATEGORY_EMOJI: Record<string, string> = {
  drinks: "🥤", beverages: "🥤", food: "🍔", snacks: "🍿", electronics: "📱",
  clothing: "👕", grocery: "🛒", dairy: "🧀", bakery: "🍞", meat: "🥩",
  fruit: "🍎", vegetables: "🥬", seafood: "🐟", default: "📦",
};

function getProductEmoji(category: string): string {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_EMOJI.default;
}

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

export function CheckoutConsole({ products, cashierName, visionEnabled, autoPrint, taxEnabled, taxRate, currencySymbol }: { products: CheckoutProduct[]; cashierName: string; visionEnabled: boolean; autoPrint: boolean; taxEnabled: boolean; taxRate: number; currencySymbol: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutError, setCheckoutError] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashTenderedInput, setCashTenderedInput] = useState("");
  const [invoiceFormat, setInvoiceFormat] = useState<InvoiceFormat>("RECEIPT");
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [invoicePreviewData, setInvoicePreviewData] = useState<InvoicePrintData | null>(null);
  const [sizePickerProduct, setSizePickerProduct] = useState<CheckoutProduct | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProducts = useMemo(() => {
    let result = products;
    if (categoryFilter) result = result.filter((p) => p.category === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return result;
  }, [products, categoryFilter, searchQuery]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const [manualDiscount, setManualDiscount] = useState(0);
  const discount = manualDiscount;
  const tax = taxEnabled ? Math.round((subtotal - discount) * (taxRate / 100)) : 0;
  const total = subtotal - discount + tax;
  const cashTendered = Number(cashTenderedInput || 0);
  const changeDue = Math.max(0, cashTendered - total);
  const isCashPaymentShort = paymentMethod === "CASH" && cashTendered < total;

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

  function setItemQuantity(cartKey: string, quantity: number) {
    setCart((current) =>
      current
        .map((item) => (item.cartKey === cartKey ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  function openPayment(format: InvoiceFormat = "RECEIPT") {
    if (cart.length === 0 || isCompleting) return;
    setInvoiceFormat(format);
    setPaymentOpen(true);
    setCheckoutError("");
    setCashTenderedInput("");
  }

  async function completeSale() {
    if (cart.length === 0 || isCompleting) return;
    setCheckoutError("");

    if (isCashPaymentShort) {
      setCheckoutError("Enter enough cash received before completing the sale.");
      return;
    }

    setIsCompleting(true);

    try {
      const res = await fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceFormat,
          paymentMethod,
          discountAmount: discount,
          amountTendered: paymentMethod === "CASH" ? cashTendered : undefined,
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
      setCashTenderedInput("");
      setInvoicePreviewData(data.invoiceData);
      setShowInvoicePopup(true);

      if (autoPrint && isPrinterConnected() && data.invoiceData) {
        try {
          const lines = buildReceiptLines({
            businessName: data.invoiceData.businessName,
            storeName: data.invoiceData.storeName,
            storeAddress: data.invoiceData.storeAddress || undefined,
            invoiceNumber: data.invoiceData.invoiceNumber,
            createdAt: data.invoiceData.createdAt,
            cashierName: data.invoiceData.cashierName,
            paymentMethod: data.invoiceData.paymentMethod,
            currencySymbol: data.invoiceData.currencySymbol,
            items: data.invoiceData.items,
            subtotal: data.invoiceData.subtotal,
            discountAmount: data.invoiceData.discountAmount,
            taxAmount: data.invoiceData.taxAmount,
            totalAmount: data.invoiceData.totalAmount,
            amountTendered: data.invoiceData.amountTendered,
            changeDue: data.invoiceData.changeDue,
            footer: data.invoiceData.footer,
            invoiceId: data.invoiceId,
          });
          await printReceipt(lines);
        } catch {}
      }
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
            <Input className="min-h-14 rounded-3xl pl-12 text-base" placeholder="Search or scan product..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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

        {visionEnabled && <CameraScanner products={products} onProductMatched={addOrPickSize} />}

        {products.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-[32px] border border-dashed border-[#dfebf3] bg-[#fbfdff] p-10 text-center">
            <div>
              <p className="text-xl font-semibold text-[#060b1f]">No products available</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#607080]">Ask an admin to add products and stock before using checkout.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              <div className="relative flex gap-1.5 rounded-full bg-[#f1f7fb] p-1.5">
                {["All", ...Array.from(new Set(products.map((p) => p.category)))].map((cat) => {
                  const isActive = (cat === "All" && !categoryFilter) || categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat === "All" ? null : cat)}
                      className="relative z-10 shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold text-[#607080] transition-colors duration-200 hover:text-[#060b1f]"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="category-pill"
                          className="absolute inset-0 rounded-full bg-[#060b1f] shadow-lg"
                          style={{ zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className={`relative z-10 ${isActive ? "text-white" : ""}`}>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-3 md:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addOrPickSize(product)}
                  disabled={product.stock <= 0}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#f0f4f8] bg-white text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-[#15bdf2] hover:shadow-[0_8px_24px_rgba(21,189,242,0.12)]"
                >
                  <div className="flex aspect-square items-center justify-center text-4xl" style={{ background: `${product.color}12` }}>
                    {getProductEmoji(product.category)}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <span className="text-xs font-semibold leading-tight text-[#060b1f] line-clamp-2">{product.name}</span>
                    <span className="text-sm font-bold text-[#f97316]">{formatMoney(product.price)}</span>
                  </div>
                  <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#f97316] text-white opacity-0 shadow-md transition group-hover:opacity-100">
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          </>
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
                <Stepper value={item.quantity} min={0} max={999} size="sm" onChange={(quantity) => setItemQuantity(item.cartKey, quantity)} />
                <strong className="text-xl text-[#060b1f]">{formatMoney(item.price * item.quantity)}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[30px] bg-[#f1f7fb] p-5">
          <div className="space-y-3 text-sm font-bold text-[#607080]">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex items-center justify-between gap-2">
              <span>Discount</span>
              <div className="relative w-28">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#607080]">{currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="1"
                  value={manualDiscount || ""}
                  onChange={(e) => setManualDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#dfebf3] bg-white py-1.5 pl-8 pr-2 text-right text-sm font-semibold text-[#060b1f] outline-none focus:border-[#6F35F5]"
                />
              </div>
            </div>
            {taxEnabled && (
              <div className="flex justify-between"><span>Tax {taxRate}%</span><span>{formatMoney(tax)}</span></div>
            )}
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

        <div className="mt-4 space-y-3">
          <div className="flex rounded-full bg-[#f1f7fb] p-1">
            {(["RECEIPT", "A4"] as InvoiceFormat[]).map((fmt) => {
              const isActive = invoiceFormat === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => setInvoiceFormat(fmt)}
                  className="relative flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition-colors duration-200"
                >
                  {isActive && (
                    <motion.div
                      layoutId="invoice-format-pill"
                      className="absolute inset-0 rounded-full bg-white shadow-md"
                      style={{ zIndex: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? "text-[#060b1f]" : "text-[#607080]"}`}>
                    {fmt === "RECEIPT" ? "Receipt" : "A4 Invoice"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button size="touch" variant="soft" onClick={() => openPayment(invoiceFormat)} disabled={cart.length === 0 || isCompleting}>
              <Printer className="mr-2 h-5 w-5" /> Print
            </Button>
            <Button size="touch" variant="gradient" onClick={() => openPayment(invoiceFormat)} disabled={cart.length === 0 || isCompleting}>
              Complete Sale
            </Button>
          </div>
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
              {paymentMethods.map((method) => {
                const isActive = paymentMethod === method.value;
                return (
                  <motion.button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    disabled={isCompleting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative overflow-hidden rounded-[22px] border p-4 text-left transition-colors duration-200"
                    style={{
                      borderColor: isActive ? "#7c3aed" : "#dfebf3",
                      backgroundColor: isActive ? "#f5f0ff" : "#fbfdff",
                    }}
                    animate={{
                      boxShadow: isActive
                        ? "0 16px 34px rgba(124, 58, 237, 0.18)"
                        : "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="payment-active-bg"
                        className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-[#7c3aed] to-[#6366f1] opacity-[0.06]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative block font-semibold text-[#060b1f]">{method.label}</span>
                    <span className="relative mt-1 block text-xs font-medium text-[#607080]">{method.helper}</span>
                  </motion.button>
                );
              })}
            </div>

            {paymentMethod === "CASH" && (
              <div className="mt-5 rounded-[24px] border border-[#dfebf3] bg-[#fbfdff] p-4">
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#607080]">Cash received</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#607080]">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    autoFocus
                    value={cashTenderedInput}
                    onChange={(e) => setCashTenderedInput(e.target.value)}
                    placeholder="Enter customer cash"
                    disabled={isCompleting}
                    className="min-h-14 w-full rounded-2xl border border-[#dfebf3] bg-white pl-12 pr-4 text-2xl font-semibold text-[#060b1f] outline-none transition focus:border-[#15bdf2] focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCashTenderedInput(String(total))} disabled={isCompleting} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-[#060b1f] ring-1 ring-[#dfebf3] hover:bg-[#f1f7fb]">
                    Exact cash
                  </button>
                  <button type="button" onClick={() => setCashTenderedInput(String(Math.ceil(total / 100) * 100))} disabled={isCompleting} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-[#060b1f] ring-1 ring-[#dfebf3] hover:bg-[#f1f7fb]">
                    Round up
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#eefdf4] px-4 py-3">
                  <span className="text-sm font-bold text-emerald-800">Change to return</span>
                  <strong className="text-2xl font-semibold text-emerald-700">{formatMoney(changeDue)}</strong>
                </div>
                {isCashPaymentShort && (
                  <p className="mt-2 text-xs font-semibold text-red-600">Cash received must be at least {formatMoney(total)}.</p>
                )}
              </div>
            )}

            {checkoutError && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{checkoutError}</div>}

            <Button className="mt-5 w-full" size="touch" variant="gradient" onClick={completeSale} disabled={isCompleting || isCashPaymentShort}>
              {isCompleting ? "Saving paid transaction..." : `Mark Paid (${paymentMethods.find((method) => method.value === paymentMethod)?.label})`}
            </Button>
          </div>
        </div>
      )}

      {showInvoicePopup && invoicePreviewData && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md">
            {isPrinterConnected() && (
              <button
                onClick={async () => {
                  try {
                    const lines = buildReceiptLines({
                      businessName: invoicePreviewData.businessName,
                      storeName: invoicePreviewData.storeName,
                      storeAddress: invoicePreviewData.storeAddress || undefined,
                      invoiceNumber: invoicePreviewData.invoiceNumber,
                      createdAt: invoicePreviewData.createdAt,
                      cashierName: invoicePreviewData.cashierName,
                      paymentMethod: invoicePreviewData.paymentMethod,
                      currencySymbol: invoicePreviewData.currencySymbol,
                      items: invoicePreviewData.items,
                      subtotal: invoicePreviewData.subtotal,
                      discountAmount: invoicePreviewData.discountAmount,
                      taxAmount: invoicePreviewData.taxAmount,
                      totalAmount: invoicePreviewData.totalAmount,
                      amountTendered: invoicePreviewData.amountTendered,
                      changeDue: invoicePreviewData.changeDue,
                      footer: invoicePreviewData.footer,
                      invoiceId: invoicePreviewData.invoiceId,
                    });
                    await printReceipt(lines);
                  } catch {}
                }}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6F35F5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5a28d4]"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
            )}
            <InvoicePopup invoiceData={invoicePreviewData} onNext={handleNextCustomer} />
          </div>
        </div>
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
