import Link from "next/link";
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
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-[#dfebf3] bg-white/90 p-5 backdrop-blur lg:block">
      <div className="mb-8 rounded-[26px] bg-[#f8fbff] p-4">
        <Logo />
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-[#607080] transition hover:bg-[#f1f7fb] hover:text-[#060b1f]"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
