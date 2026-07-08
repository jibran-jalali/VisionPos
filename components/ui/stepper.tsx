"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepperProps = {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
  size?: "sm" | "md";
  className?: string;
};

export function Stepper({
  value,
  defaultValue = 0,
  min = 0,
  max = 999,
  onChange,
  size = "md",
  className,
}: StepperProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const [direction, setDirection] = React.useState(0);
  const [tick, setTick] = React.useState(0);

  const current = isControlled ? value! : internal;
  const digits = current.toString().split("");

  function step(dir: number) {
    const next = Math.min(max, Math.max(min, current + dir));
    if (next === current) return;
    setDirection(dir);
    setTick((t) => t + 1);
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  const buttonClass = size === "sm" ? "h-9 w-9" : "h-11 w-11 sm:h-12 sm:w-12";
  const digitClass = size === "sm" ? "h-7 min-w-8 text-lg" : "h-8 min-w-10 text-2xl";

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="flex items-center gap-2 rounded-full border border-[#dfebf3] bg-white px-1.5 py-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={current <= min}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-[#f1f7fb] text-[#607080] transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#e8f1f8] hover:text-[#060b1f]",
            buttonClass,
          )}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden font-bold tabular-nums text-[#060b1f]", digitClass)}>
          <div key={`${current}-${tick}`} className={cn("stepper-digits flex items-center justify-center gap-0.5", direction >= 0 ? "stepper-up" : "stepper-down")}>
            {digits.map((digit, index) => (
              <span key={`${index}-${digit}`} className="inline-flex min-w-[0.55em] justify-center">
                {digit}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={current >= max}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-[#f1f7fb] text-[#607080] transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#e8f1f8] hover:text-[#060b1f]",
            buttonClass,
          )}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <style jsx>{`
        .stepper-digits {
          animation-duration: 180ms;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          animation-fill-mode: both;
          will-change: transform, opacity, filter;
        }

        .stepper-up {
          animation-name: stepper-up;
        }

        .stepper-down {
          animation-name: stepper-down;
        }

        @keyframes stepper-up {
          from {
            transform: translateY(12px) scale(0.86);
            opacity: 0;
            filter: blur(2px);
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
            filter: blur(0);
          }
        }

        @keyframes stepper-down {
          from {
            transform: translateY(-12px) scale(0.86);
            opacity: 0;
            filter: blur(2px);
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
}
