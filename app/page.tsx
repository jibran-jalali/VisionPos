"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Barcode, Boxes, Camera, ReceiptText, Settings, Shield, ShoppingCart, Smartphone, Store, Users, Zap } from "lucide-react";

function BrowserMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[780px]">
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_40px_100px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-2 border-b border-[#f1f5f9] bg-[#f8fafc] px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
          <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
          <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
          <div className="ml-4 flex-1 rounded-lg bg-white px-3 py-1 text-xs text-[#94a3b8] shadow-sm">visionpos.vercel.app/pos/checkout</div>
        </div>
        <div className="grid grid-cols-[1fr_280px] gap-0">
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online counter
              </span>
            </div>
            <h3 className="mb-3 text-lg font-semibold text-[#060b1f]">Main Store Checkout</h3>
            <div className="mb-3 flex gap-2">
              <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] px-3 py-2">
                <p className="text-[9px] font-bold text-[#94a3b8]">CAMERA</p>
                <p className="text-xs font-semibold text-[#060b1f]">Vision + Barcode</p>
              </div>
              <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] px-3 py-2">
                <p className="text-[9px] font-bold text-[#94a3b8]">INVOICE</p>
                <p className="text-xs font-semibold text-[#060b1f]">Receipt + A4</p>
              </div>
            </div>
            <div className="mb-3 flex gap-1.5">
              {["All", "Drinks", "Bottle", "Soaps"].map((c) => (
                <span key={c} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${c === "All" ? "bg-[#060b1f] text-white" : "bg-[#f1f5f9] text-[#64748b]"}`}>{c}</span>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { emoji: "🥤", name: "Sprite 1ltr", price: "Rs 120", bg: "#eef2ff" },
                { emoji: "📦", name: "Bottle", price: "Rs 1,000", bg: "#fdf2f8" },
                { emoji: "📦", name: "Drink", price: "Rs 850", bg: "#f0fdf4" },
                { emoji: "🥤", name: "Pepsi 500ml", price: "Rs 80", bg: "#fff7ed" },
              ].map((p) => (
                <div key={p.name} className="overflow-hidden rounded-xl border border-[#f1f5f9]">
                  <div className="flex aspect-square items-center justify-center text-2xl" style={{ background: p.bg }}>{p.emoji}</div>
                  <div className="p-1.5">
                    <p className="text-[9px] font-semibold text-[#060b1f] leading-tight">{p.name}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-[#f97316]">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-l border-[#f1f5f9] bg-[#f8fafc] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">Current cart</span>
              <span className="text-[10px] font-semibold text-[#94a3b8]">Clear</span>
            </div>
            <h4 className="mb-4 text-lg font-semibold text-[#060b1f]">Checkout</h4>
            <div className="mb-4 space-y-2">
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-2.5">
                <p className="text-[10px] font-semibold text-[#060b1f]">Sprite 1ltr</p>
                <p className="text-[9px] text-[#94a3b8]">Rs 120 × 2</p>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-2.5">
                <p className="text-[10px] font-semibold text-[#060b1f]">Bottle</p>
                <p className="text-[9px] text-[#94a3b8]">Rs 1,000 × 1</p>
              </div>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-3">
              <div className="mb-1 flex justify-between text-[10px] text-[#64748b]"><span>Subtotal</span><span>Rs 1,240</span></div>
              <div className="mb-1 flex justify-between text-[10px] text-[#64748b]"><span>Tax 5%</span><span>Rs 62</span></div>
              <div className="mt-2 flex items-center justify-between border-t border-[#f1f5f9] pt-2">
                <span className="text-xs font-semibold text-[#060b1f]">Total</span>
                <span className="text-sm font-bold text-[#060b1f]">Rs 1,302</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center gap-1 rounded-xl border border-[#e2e8f0] bg-white py-2 text-[10px] font-semibold text-[#64748b]">
                <ReceiptText className="h-3 w-3" /> Receipt
              </div>
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-r from-[#6F35F5] to-[#15bdf2] py-2 text-[10px] font-bold text-white">
                Complete Sale
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: Camera, title: "Camera Vision", desc: "Point your phone camera at any product. VisionAI recognizes it automatically — no barcode needed." },
  { icon: Barcode, title: "Barcode Scanning", desc: "Works with any USB scanner or your device camera. Native BarcodeDetector + ZXing fallback for every browser." },
  { icon: Boxes, title: "Inventory Tracking", desc: "Real-time stock levels per store. Low-stock alerts, movement history, and reorder-level tracking built in." },
  { icon: ReceiptText, title: "Receipts & Invoices", desc: "Print 80mm thermal receipts or A4 invoices. Connect any ESC/POS printer via USB — auto-print after each sale." },
  { icon: Users, title: "Roles & Permissions", desc: "Owner, Admin, Manager, Cashier — each with scoped access. Cashiers see only checkout. Admins see everything." },
  { icon: Smartphone, title: "Works on Any Device", desc: "Runs in Chrome, Edge, Firefox, Safari. No app to install. Cashiers use it on phones, tablets, or desktops." },
];

const steps = [
  { num: "01", title: "Add your products", desc: "Scan each product barcode with your phone camera. Name, price, and SKU auto-fill. Record a short video for vision training." },
  { num: "02", title: "Scan or tap to sell", desc: "At checkout, point the camera at any product or scan its barcode. VisionAI or barcode adds it to the cart instantly." },
  { num: "03", title: "Print receipt & track", desc: "Cash, card, or wallet — pick payment, hit Complete. Receipt prints automatically. Revenue, stock, and reports update in real time." },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    desc: "For single-shop owners who want to try VisionPOS before committing.",
    features: ["1 store", "1 cashier account", "Camera barcode scanning", "Vision AI product matching", "Receipt + A4 invoices", "Inventory tracking", "Community support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rs 3,500",
    period: "/month",
    desc: "For growing businesses that need multiple stores and advanced features.",
    features: ["Unlimited stores", "Unlimited cashiers", "Everything in Starter", "USB thermal printer support", "Auto-print receipts", "Sales & inventory reports", "WhatsApp support", "Priority onboarding"],
    cta: "Start 30-day trial",
    highlight: true,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#f1f5f9] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#15bdf2] to-[#6F35F5] text-sm font-bold text-white">V</div>
            <span className="text-lg font-semibold text-[#060b1f]">VisionPOS</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-[#64748b] hover:text-[#060b1f] transition">Features</a>
            <a href="#how" className="text-sm font-medium text-[#64748b] hover:text-[#060b1f] transition">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-[#64748b] hover:text-[#060b1f] transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-[#64748b] hover:text-[#060b1f] transition">Login</Link>
            <Link href="/register" className="rounded-xl bg-[#060b1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#111827] transition">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="overflow-hidden px-5 pt-16 pb-8 md:pt-24 md:pb-12">
        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 py-1.5 text-sm font-medium text-[#64748b]">
            <BadgeCheck className="h-4 w-4 text-[#22c55e]" /> Trusted by retail shops across Pakistan
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-[#060b1f] md:text-6xl lg:text-7xl">
            Browser POS for shops<br className="hidden md:block" /> that want to <span className="bg-gradient-to-r from-[#15bdf2] to-[#6F35F5] bg-clip-text text-transparent">move fast</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#64748b] md:text-lg">
            Scan barcodes, use camera vision, manage stock, print receipts, and run checkout from any device. No downloads, no setup, no fees for small shops.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#060b1f] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#111827] transition">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pos/checkout" className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-7 py-3.5 text-sm font-semibold text-[#060b1f] hover:bg-[#f8fafc] transition">
              Try the demo
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-5xl md:mt-16">
          <BrowserMockup />
        </div>
      </section>

      {/* Logos / trust bar */}
      <section className="border-y border-[#f1f5f9] bg-[#fafbfc] px-5 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 text-sm font-medium text-[#94a3b8]">
          <span className="flex items-center gap-2"><Store className="h-4 w-4" /> Grocery stores</span>
          <span className="flex items-center gap-2"><Banknote className="h-4 w-4" /> Clothing shops</span>
          <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> General stores</span>
          <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Bakeries & cafes</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-lg text-center">
            <span className="text-sm font-bold tracking-wide text-[#6F35F5]">Features</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#060b1f] md:text-4xl">Everything your shop needs</h2>
            <p className="mt-3 text-base text-[#64748b]">One subscription. No hidden fees. Works on the hardware you already have.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-[#f1f5f9] bg-white p-6 transition hover:border-[#15bdf2] hover:shadow-[0_8px_30px_rgba(21,189,242,0.08)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8fafc] text-[#6F35F5] transition group-hover:bg-[#6F35F5] group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#060b1f]">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-[#f1f5f9] bg-[#fafbfc] px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-lg text-center">
            <span className="text-sm font-bold tracking-wide text-[#15bdf2]">How it works</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#060b1f] md:text-4xl">Three steps to start selling</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="relative">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#060b1f] text-sm font-bold text-white">{s.num}</span>
                <h3 className="text-xl font-semibold text-[#060b1f]">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-14 max-w-lg text-center">
            <span className="text-sm font-bold tracking-wide text-[#6F35F5]">Pricing</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#060b1f] md:text-4xl">Simple, honest pricing</h2>
            <p className="mt-3 text-base text-[#64748b]">Start free. Upgrade when your shop grows. No contracts, cancel anytime.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((p) => (
              <div key={p.name} className={`relative rounded-2xl border p-7 transition ${p.highlight ? "border-[#6F35F5] bg-gradient-to-b from-[#f5f3ff] to-white shadow-[0_8px_40px_rgba(111,53,245,0.08)]" : "border-[#e2e8f0] bg-white hover:shadow-lg"}`}>
                {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-[#6F35F5] px-3 py-0.5 text-xs font-bold text-white">Most popular</span>}
                <h3 className="text-xl font-bold text-[#060b1f]">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#060b1f]">{p.price}</span>
                  <span className="text-sm text-[#94a3b8]">{p.period}</span>
                </div>
                <p className="mt-3 text-sm text-[#64748b]">{p.desc}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#334155]">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-7 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${p.highlight ? "bg-[#6F35F5] text-white hover:bg-[#5a28d4]" : "border border-[#e2e8f0] bg-white text-[#060b1f] hover:bg-[#f8fafc]"}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-r from-[#060b1f] to-[#1e293b] p-10 text-center md:p-16">
          <h2 className="text-2xl font-bold text-white md:text-4xl">Ready to run your shop smarter?</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/60">Set up your first store in under 5 minutes. No credit card required. Works on the phone in your pocket.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#060b1f] hover:bg-[#f1f5f9] transition">
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#f1f5f9] bg-white px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#15bdf2] to-[#6F35F5] text-xs font-bold text-white">V</div>
            <span className="text-sm font-semibold text-[#060b1f]">VisionPOS</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-[#94a3b8]">
            <Link href="/login" className="hover:text-[#060b1f] transition">Login</Link>
            <Link href="/register" className="hover:text-[#060b1f] transition">Register</Link>
            <a href="#features" className="hover:text-[#060b1f] transition">Features</a>
            <a href="#pricing" className="hover:text-[#060b1f] transition">Pricing</a>
          </div>
          <p className="text-xs text-[#94a3b8]">&copy; {new Date().getFullYear()} VisionPOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
