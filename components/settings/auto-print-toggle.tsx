"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function AutoPrintToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPrint: next }),
      });
      if (res.ok) setEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
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
      {saving && <Loader2 className="h-4 w-4 animate-spin text-[#607080]" />}
      <span className="text-sm font-medium text-[#060b1f]">{enabled ? "Auto-print ON" : "Auto-print OFF"}</span>
    </div>
  );
}
