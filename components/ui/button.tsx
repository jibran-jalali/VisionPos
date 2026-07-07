import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#060b1f] text-white shadow-[0_16px_40px_rgba(6,11,31,0.18)] hover:bg-[#111827]",
        gradient: "vision-gradient text-white shadow-[0_16px_42px_rgba(21,189,242,0.28)] hover:brightness-105",
        soft: "bg-white text-[#060b1f] ring-1 ring-[#dfebf3] hover:bg-[#f1f7fb]",
        success: "bg-[#86efac] text-[#052e16] hover:bg-[#6ee7a2]",
        ghost: "text-[#607080] hover:bg-[#f1f7fb] hover:text-[#060b1f]",
        danger: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-9 rounded-xl px-3 text-xs",
        lg: "min-h-14 rounded-3xl px-7 text-base",
        touch: "min-h-16 rounded-3xl px-7 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button suppressHydrationWarning className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
