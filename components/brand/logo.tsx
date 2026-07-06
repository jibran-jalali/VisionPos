import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/vision-pos-logo.png"
        alt="VisionPOS"
        width={compact ? 44 : 170}
        height={compact ? 44 : 54}
        className={compact ? "h-11 w-11 object-contain" : "h-auto w-[170px] object-contain"}
        priority
      />
    </div>
  );
}
