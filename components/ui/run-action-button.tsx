"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { Zap } from "lucide-react";
import { HiBadgeCheck } from "react-icons/hi";
import { IoCloseSharp } from "react-icons/io5";
import { FaInbox } from "react-icons/fa6";
import { RiBubbleChartFill } from "react-icons/ri";
import { BsFileTextFill, BsSendFill, BsTagFill } from "react-icons/bs";
import { TbClockHour12Filled } from "react-icons/tb";
import { cn } from "@/lib/utils";

function AnimatedText({
  text,
  className,
  delayStep = 0.014,
}: {
  text: string;
  className?: string;
  delayStep?: number;
}) {
  const chars = text.split("");

  return (
    <span className={className} style={{ display: "inline-flex" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} style={{ display: "inline-flex", willChange: "transform" }}>
          {chars.map((char, i) => (
            <motion.span
              key={i}
              initial={{ y: 10, opacity: 0, scale: 0.5, filter: "blur(2px)" }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ y: -10, opacity: 0, scale: 0.5, filter: "blur(2px)" }}
              transition={{ type: "spring", stiffness: 240, damping: 16, mass: 1.2, delay: i * delayStep }}
              style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : undefined }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const spring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 0.8,
};

const DEFAULT_STEPS = [
  { id: 1, label: "Importing Survey Data", icon: FaInbox },
  { id: 2, label: "Refining Responses", icon: RiBubbleChartFill },
  { id: 3, label: "Labelling Responses", icon: BsTagFill },
  { id: 4, label: "Analyzing Sentiment", icon: TbClockHour12Filled },
  { id: 5, label: "Creating Reports", icon: BsFileTextFill },
  { id: 6, label: "Sharing Survey Report", icon: BsSendFill },
];

type StepItem = {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type RunActionButtonProps = {
  steps?: StepItem[];
  idleLabel?: string;
  doneLabel?: string;
  disabled?: boolean;
  intervalMs?: number;
  idleWidth?: number;
  runningWidth?: number;
  doneWidth?: number;
  className?: string;
  onStart?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
};

export function RunActionButton({
  steps = DEFAULT_STEPS,
  idleLabel = "Run Action",
  doneLabel = "Action Done",
  disabled = false,
  intervalMs = 1200,
  idleWidth = 180,
  runningWidth = 360,
  doneWidth = 200,
  className,
  onStart,
  onCancel,
  onComplete,
}: RunActionButtonProps) {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [currentStep, setCurrentStep] = useState(0);

  function startAction() {
    if (disabled) return;
    onStart?.();
    setStatus("running");
    setCurrentStep(0);
  }

  function reset() {
    if (status === "running") onCancel?.();
    setStatus("idle");
    setCurrentStep(0);
  }

  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        setStatus("done");
        onComplete?.();
        return prev;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, onComplete, status, steps.length]);

  const widths = {
    idle: idleWidth,
    running: runningWidth,
    done: doneWidth,
  };

  const CurrentIcon = steps[currentStep]?.icon || Zap;

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        initial={{ width: idleWidth }}
        animate={{ width: widths[status] }}
        transition={spring}
        className={cn(
          "relative flex h-[48px] items-center justify-between overflow-hidden rounded-full",
          status === "running" ? "border-2 border-dashed border-[#D6D6DD]" : "border-2 border-transparent",
          disabled && status === "idle" && "opacity-55",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {status === "idle" && (
            <motion.button
              key="idle"
              type="button"
              onClick={startAction}
              disabled={disabled}
              initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              transition={spring}
              className="flex flex-1 items-center gap-2 rounded-full bg-[#F4F4F9] px-5 py-3 whitespace-nowrap text-[#26262B] disabled:cursor-not-allowed"
            >
              <Zap className="h-5 w-5" />
              <AnimatedText text={idleLabel} className="text-[15px] font-semibold" />
            </motion.button>
          )}

          {status === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              transition={spring}
              className="flex flex-1 items-center justify-between gap-3 px-4 whitespace-nowrap"
            >
              <div className="flex min-w-0 items-center gap-2">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                    transition={spring}
                  >
                    <CurrentIcon className="h-5 w-5 text-[#28272A]" />
                  </motion.div>
                </AnimatePresence>
                <AnimatedText text={steps[currentStep]?.label || "Working"} className="text-[15px] font-bold text-[#28272A]" />
              </div>

              <motion.button
                type="button"
                onClick={reset}
                initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                transition={{ ...spring, delay: 0.15 }}
                className="ml-1 rounded-full bg-[#D6D5E2] p-1.5"
                aria-label="Stop action"
              >
                <IoCloseSharp className="h-4 w-4 text-white" />
              </motion.button>
            </motion.div>
          )}

          {status === "done" && (
            <motion.button
              key="done"
              type="button"
              onClick={reset}
              initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              transition={spring}
              className="flex flex-1 items-center gap-2 rounded-full bg-[#EAF9EA] px-5 py-3 whitespace-nowrap"
            >
              <HiBadgeCheck className="h-5 w-5 text-[#22c55e]" />
              <AnimatedText text={doneLabel} className="text-[15px] font-bold text-[#22c55e]" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
