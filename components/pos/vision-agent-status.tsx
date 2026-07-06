"use client";

import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getVisionAgentHealth, type VisionAgentHealth } from "@/lib/vision-agent";

export function VisionAgentStatus() {
  const [health, setHealth] = useState<VisionAgentHealth | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function checkAgent() {
      try {
        setIsChecking(true);
        setHealth(await getVisionAgentHealth(controller.signal));
      } catch {
        setHealth(null);
      } finally {
        setIsChecking(false);
      }
    }

    checkAgent();
    const interval = window.setInterval(checkAgent, 8000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const isOnline = health?.status === "ok";

  return (
    <Card className={isOnline ? "bg-[#060b1f] p-5 text-white" : "p-5"}>
      <ScanLine className={isOnline ? "mb-4 h-7 w-7 text-[#15bdf2]" : "mb-4 h-7 w-7 text-[#607080]"} />
      <p className={isOnline ? "text-sm font-bold text-white/60" : "text-sm font-bold text-[#607080]"}>Vision Module</p>
      <p className={isOnline ? "mt-1 text-xl font-semibold" : "mt-1 text-xl font-semibold text-[#060b1f]"}>
        {isChecking ? "Checking" : isOnline ? "Online" : "Offline"}
      </p>
      <p className={isOnline ? "mt-2 text-xs font-medium text-white/50" : "mt-2 text-xs font-medium text-[#607080]"}>
        {isOnline ? `v${health.version}` : "Load module on port 8767"}
      </p>
    </Card>
  );
}
