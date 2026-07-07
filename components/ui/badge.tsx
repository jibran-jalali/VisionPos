import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "green" | "violet" | "dark" | "neutral" | "warning";

const variants: Record<BadgeVariant, string> = {
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  violet: "bg-violet-100 text-violet-700",
  dark: "bg-[#060b1f] text-white",
  neutral: "bg-slate-100 text-slate-600",
  warning: "bg-amber-100 text-amber-700",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", variants[variant], className)}
      {...props}
    />
  );
}
