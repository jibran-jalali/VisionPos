"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Barcode,
  Boxes,
  Camera,
  CheckCircle2,
  ReceiptText,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#15bdf2] via-[#6F35F5] to-[#9b5cff] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(111,53,245,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(111,53,245,0.28)]";
const softButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbeafe] bg-white px-7 py-3.5 text-sm font-semibold text-[#3056d3] shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:bg-[#f8fbff]";

function BrowserMockup() {
  const products = [
    { emoji: "🥤", name: "Sprite 1ltr", price: "Rs 120", bg: "#e7f8ff" },
    { emoji: "📦", name: "Bottle", price: "Rs 1,000", bg: "#f2ecff" },
    { emoji: "🧃", name: "Drink", price: "Rs 850", bg: "#effbf5" },
    { emoji: "🥤", name: "Pepsi 500ml", price: "Rs 80", bg: "#fff7e8" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[920px]">
      <div className="absolute -inset-10 -z-10 rounded-[44px] bg-[radial-gradient(circle_at_30%_20%,rgba(21,189,242,0.24),transparent_32%),radial-gradient(circle_at_75%_70%,rgba(111,53,245,0.20),transparent_34%)] blur-2xl" />
      <div className="overflow-hidden rounded-[26px] border border-[#dce9f5] bg-white shadow-[0_42px_90px_rgba(15,23,42,0.15)]">
        <div className="flex items-center gap-2 border-b border-[#eef4fb] bg-[#fbfdff] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff6b57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd45]" />
          <span className="h-3 w-3 rounded-full bg-[#32c95b]" />
          <div className="ml-4 flex-1 rounded-xl bg-[#f1f5f9] px-4 py-1.5 text-xs font-medium text-[#94a3b8]">visionpos.app/pos/checkout</div>
          <div className="hidden gap-2 md:flex">
            <span className="h-7 w-7 rounded-lg bg-[#f1f5f9]" />
            <span className="h-7 w-7 rounded-lg bg-[#f1f5f9]" />
          </div>
        </div>

        <div className="grid gap-0 bg-[#f6faff] p-3 md:grid-cols-[1fr_330px]">
          <div className="rounded-[24px] border border-[#dfebf3] bg-white p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online counter
                </span>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#07132f]">Main Store Checkout</h3>
              </div>
              <div className="relative w-full max-w-[300px] rounded-2xl border border-[#dfebf3] bg-white px-4 py-3 text-sm font-medium text-[#9aa8b5]">
                Search or scan product...
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                ["Camera checkout", "Vision + Barcode"],
                ["Invoice mode", "Receipt + A4"],
                ["Cashier", "Jibran Jalali"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-[#dfebf3] bg-[#fbfdff] px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#7c8ca0]">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#07132f]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex gap-2 overflow-hidden">
              {["All", "Drinks", "Bottle", "Soaps", "Snacks"].map((c) => (
                <span
                  key={c}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    c === "All" ? "bg-gradient-to-r from-[#15bdf2] to-[#6F35F5] text-white shadow-sm" : "bg-[#f1f7fb] text-[#607080]"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {products.map((p) => (
                <div key={p.name} className="overflow-hidden rounded-[20px] border border-[#edf4fa] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
                  <div className="flex aspect-square items-center justify-center text-3xl" style={{ background: p.bg }}>
                    {p.emoji}
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-semibold leading-tight text-[#07132f]">{p.name}</p>
                    <p className="mt-1 text-xs font-bold text-[#ff6b00]">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-[24px] border border-[#dfebf3] bg-white p-5 md:ml-3 md:mt-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-[#e7f8ff] px-3 py-1 text-xs font-bold text-[#0284c7]">Current cart</span>
              <span className="rounded-xl border border-[#dfebf3] px-3 py-2 text-xs font-semibold text-[#607080]">Clear</span>
            </div>
            <h4 className="mb-24 text-2xl font-semibold tracking-tight text-[#07132f] md:mb-36">Checkout</h4>
            <div className="rounded-[22px] bg-[#f1f7fb] p-4">
              <div className="mb-2 flex justify-between text-xs font-bold text-[#607080]"><span>Subtotal</span><span>Rs 1,240</span></div>
              <div className="mb-3 flex justify-between text-xs font-bold text-[#607080]"><span>Discount</span><span>Rs 0</span></div>
              <div className="flex items-center justify-between border-t border-[#dfebf3] pt-4">
                <span className="text-sm font-semibold text-[#07132f]">Total</span>
                <span className="text-3xl font-semibold text-[#07132f]">Rs 1,240</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-center gap-2 rounded-[18px] border border-[#dfebf3] bg-white py-3 text-xs font-semibold text-[#607080]">
                <ReceiptText className="h-4 w-4" /> Receipt
              </div>
              <div className="flex items-center justify-center rounded-[18px] bg-gradient-to-r from-[#84d8ff] to-[#a896ff] py-3 text-xs font-bold text-white shadow-[0_14px_32px_rgba(111,53,245,0.18)]">
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
  { icon: Camera, title: "Camera Vision", desc: "Recognize trained products from the checkout camera, with a live scan indicator for cashiers." },
  { icon: Barcode, title: "Barcode Scanning", desc: "Use the browser camera or any USB scanner. No separate Windows software needed." },
  { icon: Boxes, title: "Inventory Control", desc: "Track stock, low alerts, variants, and sales deductions across your store." },
  { icon: ReceiptText, title: "Receipt Printing", desc: "Print receipt or A4 invoice after every sale. ESC/POS support is ready for thermal printers." },
  { icon: Users, title: "Cashier Accounts", desc: "Create staff accounts, control roles, and keep owners away from checkout-only screens." },
  { icon: Smartphone, title: "Phone, Tablet, Desktop", desc: "Runs in the browser on the devices small shops already own." },
];

const steps = [
  { num: "01", title: "Add products", desc: "Enter price, stock, barcode, variants, and a quick product video for vision matching." },
  { num: "02", title: "Sell quickly", desc: "Search, tap, scan barcode, or point the camera at the item. The cart updates instantly." },
  { num: "03", title: "Print and track", desc: "Complete payment, print the receipt, and update stock automatically." },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    desc: "For a shop owner who wants to test the system with real products.",
    features: ["1 store", "1 cashier", "Barcode scanning", "Inventory tracking", "Receipt + A4 invoices"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rs 3,500",
    period: "/month",
    desc: "For stores that want printer support, staff accounts, and guided setup.",
    features: ["Unlimited cashiers", "Vision product matching", "USB printer support", "Auto-print receipts", "WhatsApp support"],
    cta: "Start trial",
    highlight: true,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfdff] text-[#07132f]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(21,189,242,0.14),transparent_28rem),radial-gradient(circle_at_90%_10%,rgba(111,53,245,0.13),transparent_30rem),linear-gradient(180deg,#ffffff_0%,#f7fbff_45%,#ffffff_100%)]" />

      <nav className="sticky top-0 z-50 border-b border-[#edf4fa] bg-white/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center">
            <Logo className="scale-90 origin-left" />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-semibold text-[#607080] transition hover:text-[#6F35F5]">Features</a>
            <a href="#how" className="text-sm font-semibold text-[#607080] transition hover:text-[#6F35F5]">Workflow</a>
            <a href="#pricing" className="text-sm font-semibold text-[#607080] transition hover:text-[#6F35F5]">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-[#607080] transition hover:text-[#6F35F5] sm:block">Login</Link>
            <Link href="/register" className="rounded-2xl bg-gradient-to-r from-[#15bdf2] to-[#6F35F5] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(111,53,245,0.18)] transition hover:-translate-y-0.5">
              Start setup
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-5 pb-14 pt-14 md:px-8 md:pb-20 md:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dbeafe] bg-white px-4 py-2 text-sm font-semibold text-[#3564d4] shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
              <Sparkles className="h-4 w-4 text-[#6F35F5]" /> Built for real shop counters
            </div>
            <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#07132f] md:text-7xl">
              Fast checkout without the old POS headache.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#607080]">
              VisionPOS runs from the browser. Scan barcodes, recognize products with the camera, manage stock, and print receipts without installing a local engine.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={primaryButton}>
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pos/checkout" className={softButton}>
                Open demo checkout
              </Link>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {[
                ["0", "installs"],
                ["80mm", "printer ready"],
                ["PKR", "local pricing"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[20px] border border-[#edf4fa] bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <p className="text-2xl font-semibold text-[#07132f]">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-[#8a99aa]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <BrowserMockup />
        </div>
      </section>

      <section className="border-y border-[#edf4fa] bg-white/76 px-5 py-6 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 text-sm font-semibold text-[#8a99aa] md:gap-10">
          <span className="flex items-center gap-2"><Store className="h-4 w-4 text-[#15bdf2]" /> Grocery stores</span>
          <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-[#6F35F5]" /> Clothing shops</span>
          <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-[#15bdf2]" /> General stores</span>
          <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#6F35F5]" /> Bakeries & cafes</span>
        </div>
      </section>

      <section id="features" className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6F35F5]">Features</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#07132f] md:text-5xl">The important parts are already connected.</h2>
            <p className="mt-4 text-base leading-7 text-[#607080]">No fluffy modules. These are the things a shop owner asks for on day one.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-[28px] border border-[#edf4fa] bg-white p-6 shadow-[0_14px_38px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-[#cfe5ff] hover:shadow-[0_24px_60px_rgba(21,189,242,0.10)]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e7f8ff] to-[#f2ecff] text-[#6F35F5]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#07132f]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#607080]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-gradient-to-b from-[#f7fbff] to-white px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#15bdf2]">Workflow</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#07132f] md:text-5xl">From shelf to receipt in three steps.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num} className="rounded-[30px] border border-[#edf4fa] bg-white p-7 shadow-[0_18px_46px_rgba(15,23,42,0.05)]">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#15bdf2] to-[#6F35F5] text-sm font-bold text-white shadow-[0_14px_34px_rgba(111,53,245,0.18)]">{step.num}</span>
                <h3 className="mt-6 text-xl font-semibold text-[#07132f]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#607080]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6F35F5]">Pricing</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#07132f] md:text-5xl">Simple pricing for small shops.</h2>
            <p className="mt-4 text-base text-[#607080]">Start with real products and real receipts before paying anything.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-[32px] border p-8 shadow-[0_18px_48px_rgba(15,23,42,0.05)] ${plan.highlight ? "border-[#c8b7ff] bg-gradient-to-b from-[#f6f2ff] to-white" : "border-[#edf4fa] bg-white"}`}>
                {plan.highlight && <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-[#15bdf2] to-[#6F35F5] px-4 py-1 text-xs font-bold text-white">Best for stores</span>}
                <h3 className="text-2xl font-semibold text-[#07132f]">{plan.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#607080]">{plan.desc}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-[-0.04em] text-[#07132f]">{plan.price}</span>
                  <span className="pb-1 text-sm font-semibold text-[#8a99aa]">{plan.period}</span>
                </div>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm font-medium text-[#405267]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-8 flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold transition ${plan.highlight ? "bg-gradient-to-r from-[#15bdf2] to-[#6F35F5] text-white shadow-[0_16px_36px_rgba(111,53,245,0.20)] hover:-translate-y-0.5" : "border border-[#dbeafe] bg-white text-[#3056d3] hover:bg-[#f8fbff]"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8 md:pb-28">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-[#dbeafe] bg-[linear-gradient(135deg,#effbff_0%,#f6f2ff_55%,#ffffff_100%)] p-8 shadow-[0_24px_70px_rgba(111,53,245,0.10)] md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#07132f] md:text-5xl">Try it on your own products.</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#607080]">Create a store, add a few items, scan with your camera, and see if it fits your counter before selling it to customers.</p>
            </div>
            <Link href="/register" className={primaryButton}>
              Create account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#edf4fa] bg-white px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <Logo className="scale-75 origin-left" />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-[#8a99aa]">
            <Link href="/login" className="transition hover:text-[#6F35F5]">Login</Link>
            <Link href="/register" className="transition hover:text-[#6F35F5]">Register</Link>
            <a href="#features" className="transition hover:text-[#6F35F5]">Features</a>
            <a href="#pricing" className="transition hover:text-[#6F35F5]">Pricing</a>
          </div>
          <p className="text-xs font-medium text-[#9aa8b5]">&copy; {new Date().getFullYear()} VisionPOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
