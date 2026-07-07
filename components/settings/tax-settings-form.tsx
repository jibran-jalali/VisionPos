"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaxSettingsFormProps {
  initialEnabled: boolean;
  initialRate: number;
}

export function TaxSettingsForm({ initialEnabled, initialRate }: TaxSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [rate, setRate] = useState(String(initialRate));
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
          taxEnabled: enabled,
          taxRate: parseFloat(rate) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save tax settings.");
        return;
      }
      setStatus("Tax settings saved.");
    } catch {
      setError("Could not save. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
            enabled ? "bg-[#6F35F5]" : "bg-[#dfebf3]"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            } mt-0.5`}
          />
        </button>
        <span className="text-sm font-medium text-[#060b1f]">{enabled ? "Tax ON" : "Tax OFF"}</span>
      </div>

      {enabled && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#607080]">Tax Rate (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.001"
            placeholder="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      )}

      {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {status && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{status}</div>}

      <Button variant="gradient" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Tax Settings"}
      </Button>
    </div>
  );
}
