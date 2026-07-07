"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface InvoiceSettingsFormProps {
  initialFormat: string;
  initialCurrencyCode: string;
  initialCurrencySymbol: string;
  initialFooter: string;
}

export function InvoiceSettingsForm({
  initialFormat,
  initialCurrencyCode,
  initialCurrencySymbol,
  initialFooter,
}: InvoiceSettingsFormProps) {
  const [format, setFormat] = useState(initialFormat);
  const [currencyCode, setCurrencyCode] = useState(initialCurrencyCode);
  const [currencySymbol, setCurrencySymbol] = useState(initialCurrencySymbol);
  const [footer, setFooter] = useState(initialFooter);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultInvoiceFormat: format,
          currencyCode,
          currencySymbol,
          invoiceFooter: footer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save invoice settings.");
        return;
      }
      setStatus("Invoice settings saved.");
    } catch {
      setError("Could not save. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#607080]">Default Invoice Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="min-h-12 w-full rounded-2xl border border-[#dfebf3] bg-white px-4 text-sm text-[#060b1f] outline-none transition focus:border-[#15bdf2] focus:ring-4 focus:ring-sky-100"
        >
          <option value="RECEIPT">Receipt (thermal)</option>
          <option value="A4">A4 Invoice</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#607080]">Currency Code</label>
          <Input
            placeholder="PKR"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#607080]">Currency Symbol</label>
          <Input
            placeholder="Rs"
            value={currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#607080]">Invoice Footer</label>
        <Textarea
          placeholder="Thank you for shopping with us."
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
        />
      </div>

      {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {status && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{status}</div>}

      <Button variant="gradient" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Invoice Settings"}
      </Button>
    </div>
  );
}
