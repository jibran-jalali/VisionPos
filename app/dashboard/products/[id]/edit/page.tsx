"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Variant = {
  id?: string;
  name: string;
  priceAdj: number;
  sku: string;
  barcode: string;
  sortOrder: number;
  isActive: boolean;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  description: string | null;
  isActive: boolean;
  isVisionEnabled: boolean;
  category: { id: string; name: string } | null;
  variants: Variant[];
  inventory: { store: { name: string }; quantity: number }[];
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    categoryName: "",
    description: "",
  });
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        router.push("/dashboard/products");
        return;
      }
      const data = await res.json();
      setProduct(data);
      setForm({
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || "",
        price: String(data.price),
        categoryName: data.category?.name || "",
        description: data.description || "",
      });
      setVariants(
        data.variants.map((v: Variant) => ({
          ...v,
          priceAdj: Number(v.priceAdj),
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  function addVariant() {
    setVariants([
      ...variants,
      { name: "", priceAdj: 0, sku: "", barcode: "", sortOrder: variants.length, isActive: true },
    ]);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: string, value: string | number | boolean) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          barcode: form.barcode || null,
          price: parseFloat(form.price),
          categoryName: form.categoryName || null,
          description: form.description || null,
          variants: variants.map((v, i) => ({
            ...v,
            sortOrder: i,
          })),
        }),
      });

      if (res.ok) {
        router.push("/dashboard/products");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell title="Edit Product" eyebrow="Catalog management">
        <div className="text-sm font-medium text-[#607080]">Loading product...</div>
      </DashboardShell>
    );
  }

  if (!product) return null;

  return (
    <DashboardShell title="Edit Product" eyebrow="Catalog management">
      <Link
        href="/dashboard/products"
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#607080] transition hover:text-[#060b1f]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Update the product information below.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4 px-6 pb-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#060b1f]">Product name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Product name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#060b1f]">SKU</label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#060b1f]">Barcode</label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Barcode (optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#060b1f]">Price (Rs)</label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#060b1f]">Category</label>
                <Input
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                  placeholder="Category name"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#060b1f]">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="w-full rounded-2xl border border-[#dfebf3] bg-white px-4 py-3 text-sm font-medium text-[#060b1f] placeholder:text-[#9aa8b5] focus:outline-none focus:ring-2 focus:ring-[#15BDF2]"
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Variants</CardTitle>
                <CardDescription>Manage product variants and their price adjustments.</CardDescription>
              </div>
              <Button variant="soft" onClick={addVariant}>
                <Plus className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            </div>
          </CardHeader>
          <div className="grid gap-4 px-6 pb-6">
            {variants.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#dfebf3] p-8 text-center text-sm font-medium text-[#607080]">
                No variants. Add a variant to offer size, color, or other options.
              </div>
            ) : (
              variants.map((variant, index) => (
                <div key={index} className="flex items-end gap-3 rounded-3xl border border-[#dfebf3] p-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-bold text-[#607080]">Name</label>
                    <Input
                      value={variant.name}
                      onChange={(e) => updateVariant(index, "name", e.target.value)}
                      placeholder="e.g. Large, Red"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-xs font-bold text-[#607080]">Price Adj.</label>
                    <Input
                      type="number"
                      value={variant.priceAdj}
                      onChange={(e) => updateVariant(index, "priceAdj", parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-xs font-bold text-[#607080]">SKU</label>
                    <Input
                      value={variant.sku || ""}
                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                      placeholder="Optional"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-xs font-bold text-[#607080]">Barcode</label>
                    <Input
                      value={variant.barcode || ""}
                      onChange={(e) => updateVariant(index, "barcode", e.target.value)}
                      placeholder="Optional"
                      className="h-9 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="mb-0.5 rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Remove variant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <Button variant="gradient" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Link href="/dashboard/products">
            <Button variant="soft">Cancel</Button>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
