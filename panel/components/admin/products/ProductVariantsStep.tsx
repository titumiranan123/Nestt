"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import type { ProductVariantInput, StockStatus, VariantStatus } from "@/features/products/types";
import type { Attribute } from "@/features/attributes/types";
import { confirmAdminAction } from "@/lib/admin-swal";
import { ProductSpecificationEditor } from "./ProductSpecificationEditor";
import { SelectField, TextAreaField, TextField, ToggleField } from "./ProductFormFields";

export type VariantDraft = ProductVariantInput & { id?: string };

export function ProductVariantsStep({ variants, attributes, setVariants }: { variants: VariantDraft[]; attributes: Attribute[]; setVariants: (update: (current: VariantDraft[]) => VariantDraft[]) => void }) {
  const update = (index: number, patch: Partial<VariantDraft>) => setVariants((current) => current.map((variant, itemIndex) => itemIndex === index ? { ...variant, ...patch } : variant));
  const add = () => setVariants((current) => [...current, { name: "", slug: "", sku: "", price: 0, status: "draft", sortOrder: current.length, isDefault: current.length === 0, stockQty: 0, lowStockAlertQty: 5, stockStatus: "IN_STOCK", isOnSale: false, requiresWhiteGlove: false, features: [], variantOptions: [], media: [] }]);
  const remove = async (variant: VariantDraft, index: number) => {
    const name = variant.name.trim() || `variant ${index + 1}`;
    if (!await confirmAdminAction(`Remove ${name}?`, "The variant will be removed when you save the product.")) return;
    setVariants((current) => current.filter((item) => item !== variant).map((item, itemIndex) => ({
      ...item, sortOrder: itemIndex, isDefault: itemIndex === 0 && variant.isDefault ? true : item.isDefault,
    })));
  };
  const setDefault = (index: number) => setVariants((current) => current.map((variant, itemIndex) => ({ ...variant, isDefault: itemIndex === index })));

  return <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
    <div className="flex flex-col gap-3 border-b border-brand/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-ink">Variants</h2><p className="mt-1 text-xs text-muted">Set price, SKU, stock, and order for each sellable option.</p></div><button type="button" onClick={add} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white transition hover:bg-brand-dark"><Plus size={15} /> Add variant</button></div>
    <div className="space-y-4 p-5">
      {variants.map((variant, index) => <article key={variant.id ?? `new-${index}`} className="overflow-hidden rounded-xl border border-gray-200">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3"><div><p className="text-sm font-semibold text-gray-800">{variant.name || `Variant ${index + 1}`}</p><p className="mt-0.5 text-xs text-gray-500">{variant.sku || "SKU not set"}</p></div><div className="flex gap-2"><button type="button" onClick={() => setDefault(index)} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${variant.isDefault ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-brand/30 hover:text-brand"}`}><Check size={13} />{variant.isDefault ? "Default" : "Set default"}</button><button type="button" onClick={() => void remove(variant, index)} aria-label={`Remove ${variant.name || `variant ${index + 1}`}`} className="rounded-lg border border-red-100 p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></div></div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <TextField label="Variant name" value={variant.name} onChange={(next) => update(index, { name: next })} placeholder="e.g. Natural oak" required />
          <TextField label="Slug" value={variant.slug ?? ""} onChange={(next) => update(index, { slug: next })} placeholder="Auto-generated if blank" />
          <TextField label="SKU" value={variant.sku} onChange={(next) => update(index, { sku: next })} placeholder="Unique SKU" required />
          <TextField label="Barcode" value={variant.barcode ?? ""} onChange={(next) => update(index, { barcode: next || null })} placeholder="Optional barcode" />
          <TextField label="Price (BDT)" type="number" min="0" step="0.01" value={variant.price} onChange={(next) => update(index, { price: Number(next) || 0 })} required />
          <TextField label="Cost price (BDT)" type="number" min="0" step="0.01" value={variant.costPrice ?? ""} onChange={(next) => update(index, { costPrice: next === "" ? null : Number(next) })} />
          <TextField label="Stock quantity" type="number" min="0" step="1" value={variant.stockQty ?? 0} onChange={(next) => update(index, { stockQty: Math.max(0, Number(next) || 0) })} />
          <TextField label="Low stock alert quantity" type="number" min="0" step="1" value={variant.lowStockAlertQty ?? 5} onChange={(next) => update(index, { lowStockAlertQty: Math.max(0, Number(next) || 0) })} />
          <TextField label="Sort order" type="number" min="0" step="1" value={variant.sortOrder ?? index} onChange={(next) => update(index, { sortOrder: Math.max(0, Number(next) || 0) })} />
          <SelectField label="Status" value={variant.status ?? "draft"} onChange={(next) => update(index, { status: next as VariantStatus })} options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          <SelectField label="Stock status" value={variant.stockStatus ?? "IN_STOCK"} onChange={(next) => update(index, { stockStatus: next as StockStatus })} options={[{ value: "IN_STOCK", label: "In stock" }, { value: "LOW_STOCK", label: "Low stock" }, { value: "OUT_OF_STOCK", label: "Out of stock" }, { value: "PREORDER", label: "Preorder" }]} />
          <TextField label="Meta title" value={variant.metaTitle ?? ""} onChange={(next) => update(index, { metaTitle: next || null })} placeholder="Search result title" />
          <div className="sm:col-span-2 xl:col-span-3"><TextAreaField label="Variant description" value={variant.description ?? ""} onChange={(next) => update(index, { description: next || null })} placeholder="Optional variant description" rows={3} /></div>
          <div className="sm:col-span-2 xl:col-span-3"><TextAreaField label="Meta description" value={variant.metaDescription ?? ""} onChange={(next) => update(index, { metaDescription: next || null })} placeholder="Short search result description" rows={2} /></div>
          <div className="grid gap-2 sm:grid-cols-2 xl:col-span-3"><ToggleField label="On sale" checked={variant.isOnSale ?? false} onChange={(next) => update(index, { isOnSale: next })} /><ToggleField label="White glove delivery" checked={variant.requiresWhiteGlove ?? false} onChange={(next) => update(index, { requiresWhiteGlove: next })} /></div>
          <div className="sm:col-span-2 xl:col-span-3"><TextField label="Variant features" value={(variant.features ?? []).join(", ")} onChange={(next) => update(index, { features: next.split(",").map((feature) => feature.trim()).filter(Boolean) })} placeholder="Solid oak, hand-finished" hint="Separate features with commas." /></div>
          {attributes.length > 0 && <div className="space-y-3 sm:col-span-2 xl:col-span-3"><div><h3 className="text-sm font-semibold text-gray-800">Variant attributes</h3><p className="mt-1 text-xs text-gray-500">Choose one saved value for each attribute on this variant.</p></div><div className="grid gap-3 sm:grid-cols-2">{attributes.map((attribute) => {
            const selected = variant.variantOptions?.find((option) => option.attributeId === attribute.id);
            return <SelectField key={attribute.id} label={attribute.name} value={selected?.attributeOptionId ?? ""} onChange={(optionId) => {
              const option = attribute.options.find((item) => item.id === optionId);
              const next = (variant.variantOptions ?? []).filter((item) => item.attributeId !== attribute.id);
              if (option) next.push({ attributeId: attribute.id, attributeOptionId: option.id, displayValue: option.name, displayImage: option.image, sortOrder: next.length });
              update(index, { variantOptions: next });
            }} options={attribute.options.map((option) => ({ value: option.id, label: option.name }))} placeholder="No value selected" />;
          })}</div></div>}
          <div className="sm:col-span-2 xl:col-span-3"><TextAreaField label="Product image URLs" value={(variant.media ?? []).filter((media) => media.type === "product").map((media) => media.url).join("\n")} onChange={(next) => update(index, { media: next.split("\n").map((url) => url.trim()).filter(Boolean).map((url, mediaIndex) => ({ url, type: "product", alt: variant.name || null, isPrimary: mediaIndex === 0, displayOrder: mediaIndex })) })} placeholder={"https://…/product-front.jpg\nhttps://…/product-detail.jpg"} hint="One image URL per line. The first image is the primary image; file upload is not exposed by the current API." rows={3} /></div>
          <div className="sm:col-span-2 xl:col-span-3"><ProductSpecificationEditor value={variant.specification} onChange={(specification) => update(index, { specification })} title="Variant-specific specifications" /></div>
        </div>
      </article>)}
      {!variants.length && <div className="rounded-xl border border-dashed border-gray-300 px-5 py-10 text-center"><p className="text-sm font-semibold text-gray-700">No variants yet</p><p className="mt-1 text-xs text-gray-500">Add at least one variant to set pricing and stock.</p><button type="button" onClick={add} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand/20 px-3 text-xs font-semibold text-brand hover:bg-brand-soft"><Plus size={14} /> Add first variant</button></div>}
    </div>
  </section>;
}
