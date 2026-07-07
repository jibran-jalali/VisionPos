"use client";

import { Loader2, Printer, PrinterCheck, Unplug } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { connectPrinter, disconnectPrinter, isPrinterConnected } from "@/lib/escpos-printer";

export function PrinterSettings({ initialConnected }: { initialConnected: boolean }) {
  const [connected, setConnected] = useState(initialConnected);
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    const ok = await connectPrinter();
    setConnected(ok);
    setConnecting(false);
  }

  function handleDisconnect() {
    disconnectPrinter();
    setConnected(false);
  }

  return (
    <div className="flex items-center gap-3">
      {connected ? (
        <>
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <PrinterCheck className="h-4 w-4" /> Connected
          </span>
          <Button type="button" variant="soft" size="sm" onClick={handleDisconnect}>
            <Unplug className="mr-1 h-3.5 w-3.5" /> Disconnect
          </Button>
        </>
      ) : (
        <>
          <span className="text-sm font-medium text-[#607080]">No printer</span>
          <Button type="button" variant="primary" size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Printer className="mr-1 h-3.5 w-3.5" />}
            {connecting ? "Connecting..." : "Connect printer"}
          </Button>
        </>
      )}
    </div>
  );
}
