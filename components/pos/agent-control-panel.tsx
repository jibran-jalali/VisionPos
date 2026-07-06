"use client";

import { Cable, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVisionAgentHealth } from "@/lib/vision-agent";

export function AgentControlPanel() {
  const [message, setMessage] = useState("Download the engine installer, run it, then click Connect.");
  const [connected, setConnected] = useState(false);

  async function connect() {
    try {
      const health = await getVisionAgentHealth();
      setConnected(true);
      setMessage(`Connected — ${health.service} v${health.version} · cache ${health.cache_ready ? "ready" : "empty"}`);
    } catch {
      setConnected(false);
      setMessage("Could not connect. Make sure VisionPOS Engine is running on this PC.");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-bold text-[#607080]">Vision Module</p>
          <p className="mt-1 text-sm font-medium text-[#060b1f]">{message}</p>
          <p className="mt-2 text-xs leading-5 text-[#607080]">
            Step 1: Download engine installer. Step 2: run it (saves to desktop shortcut). Step 3: open shortcut, click Run Engine. Step 4: click Connect.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href="/api/agent-download" download>
            <Button variant="soft" type="button"><Download className="mr-2 h-4 w-4" /> Download engine</Button>
          </a>
          <Button variant="primary" type="button" onClick={connect}>
            <Cable className="mr-2 h-4 w-4" /> {connected ? "Reconnect" : "Connect"}
          </Button>
          <Button variant="ghost" type="button" onClick={connect}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
        </div>
      </div>
    </Card>
  );
}
