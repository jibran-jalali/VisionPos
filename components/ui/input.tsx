import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      suppressHydrationWarning
      className={cn(
        "min-h-12 w-full rounded-2xl border border-[#dfebf3] bg-white px-4 text-sm text-[#060b1f] outline-none transition placeholder:text-[#9aa8b5] focus:border-[#15bdf2] focus:ring-4 focus:ring-sky-100",
        className,
      )}
      {...props}
    />
  );
}
