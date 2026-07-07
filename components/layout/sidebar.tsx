"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BarChart3, Boxes, LayoutDashboard, Package, ReceiptText, Settings, ShoppingCart, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  { href: "/pos/checkout", label: "POS Checkout", icon: ShoppingCart },
  { href: "/dashboard/sales", label: "Sales", icon: ReceiptText },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/analytics", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5 text-[#060b1f]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-screen w-72 shrink-0 flex-col border-r border-[#dfebf3] bg-white/95 p-5 backdrop-blur transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between rounded-[26px] bg-[#f8fbff] p-4">
          <Logo />
          <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-[#f1f7fb] lg:hidden">
            <X className="h-5 w-5 text-[#607080]" />
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-[#607080] transition hover:bg-[#f1f7fb] hover:text-[#060b1f]"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
