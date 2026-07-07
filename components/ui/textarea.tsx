import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      suppressHydrationWarning
      className={cn(
        "min-h-24 w-full rounded-2xl border border-[#dfebf3] bg-white px-4 py-3 text-sm text-[#060b1f] outline-none transition placeholder:text-[#9aa8b5] focus:border-[#15bdf2] focus:ring-4 focus:ring-sky-100 resize-none",
        className,
      )}
      {...props}
    />
  );
}
