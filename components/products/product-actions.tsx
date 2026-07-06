"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProductActions({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter();

  async function toggleActive() {
    const form = new FormData();
    form.set("productId", productId);
    const res = await fetch("/api/products/toggle-active", { method: "POST", body: form });
    if (res.ok) router.refresh();
  }

  async function deleteProduct() {
    if (!confirm("Delete this product permanently? This cannot be undone.")) return;
    const form = new FormData();
    form.set("productId", productId);
    const res = await fetch("/api/products/delete", { method: "POST", body: form });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleActive}
        className="rounded-lg p-1.5 text-[#607080] transition hover:bg-[#f1f7fb] hover:text-[#060b1f]"
        title={isActive ? "Deactivate product" : "Activate product"}
      >
        {isActive ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={deleteProduct}
        className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
        title="Delete product permanently"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
