"use client";

import { Minus, Plus, Printer, Search, Trash2, Wifi } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CameraScanner } from "@/components/pos/camera-scanner";
import { formatMoney } from "@/lib/currency";

export type CheckoutProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  category: string;
  color: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export function CheckoutConsole({ products, cashierName }: { products: CheckoutProduct[]; cashierName: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discount = subtotal > 1000 ? 100 : 0;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + tax;

  function addToCart(product: CheckoutProduct) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }

      return [...current, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function updateQuantity(id: string, amount: number) {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item))
        .filter((item) => item.quantity > 0),
    );
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

        <CameraScanner products={products} onProductMatched={addToCart} />

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
              onClick={() => addToCart(product)}
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
            <div key={item.id} className="rounded-[28px] border border-[#dfebf3] bg-[#fbfdff] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-tight text-[#060b1f]">{item.name}</p>
                  <p className="mt-1 text-sm font-bold text-[#607080]">{formatMoney(item.price)} each</p>
                </div>
                <button onClick={() => updateQuantity(item.id, -item.quantity)} className="rounded-2xl p-2 text-[#ef4444] hover:bg-red-50">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#060b1f] ring-1 ring-[#dfebf3]"><Minus className="h-4 w-4" /></button>
                  <span className="flex h-11 min-w-12 items-center justify-center rounded-2xl bg-[#060b1f] px-4 font-semibold text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#060b1f] ring-1 ring-[#dfebf3]"><Plus className="h-4 w-4" /></button>
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

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button size="touch" variant="soft"><Printer className="mr-2 h-5 w-5" /> Print</Button>
          <Button size="touch" variant="gradient" disabled={cart.length === 0}>Complete Sale</Button>
        </div>
      </aside>
    </div>
  );
}
