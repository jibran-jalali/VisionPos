"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function resizeLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read logo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode logo"));
      img.onload = () => {
        const maxWidth = 520;
        const maxHeight = 220;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function StoreLogoForm({ initialLogoUrl }: { initialLogoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState(initialLogoUrl || "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveLogo(logoUrl: string | null) {
    setIsSaving(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save logo.");
        return;
      }
      setPreview(logoUrl || "");
      setStatus(logoUrl ? "Store logo saved. It will appear on new invoices." : "Store logo removed.");
    } catch {
      setError("Could not save logo. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      setError("Upload a PNG, JPG, or WebP logo.");
      return;
    }
    if (file.size > 2_000_000) {
      setError("Logo must be under 2MB.");
      return;
    }

    setIsSaving(true);
    setError("");
    setStatus("Preparing logo...");
    try {
      const logoUrl = await resizeLogo(file);
      await saveLogo(logoUrl);
    } catch {
      setError("Could not process that image.");
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex min-h-36 items-center justify-center rounded-3xl border border-dashed border-[#dfebf3] bg-[#fbfdff] p-6">
        {preview ? (
          <img src={preview} alt="Store logo preview" className="max-h-28 max-w-full object-contain" />
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold text-[#060b1f]">No store logo uploaded</p>
            <p className="mt-1 text-xs font-medium text-[#607080]">Invoices will use VisionPOS branding until you upload one.</p>
          </div>
        )}
      </div>

      {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {status && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{status}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="gradient" onClick={() => inputRef.current?.click()} disabled={isSaving}>
          <Upload className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Upload store logo"}
        </Button>
        <Button type="button" variant="soft" onClick={() => saveLogo(null)} disabled={isSaving || !preview}>
          <X className="mr-2 h-4 w-4" /> Remove logo
        </Button>
      </div>
    </div>
  );
}
