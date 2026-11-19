"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ProductCareItemInput } from "@/features/products/types";
import { confirmAdminAction } from "@/lib/admin-swal";

const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function ProductCareEditor({ value, onChange }: {
  value?: ProductCareItemInput[];
  onChange: (items: ProductCareItemInput[]) => void;
}) {
  const items = value ?? [];
  const update = (index: number, patch: Partial<ProductCareItemInput>) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };
  const remove = async (index: number) => {
    const name = items[index].title.trim() || `care item ${index + 1}`;
    if (!await confirmAdminAction(`Remove ${name}?`, "This care item will be removed when you save the product.")) return;
    onChange(items.filter((_, itemIndex) => itemIndex !== index).map((item, displayOrder) => ({ ...item, displayOrder })));
  };

  return <section className="space-y-3 border-t border-brand/10 pt-5">
    <div className="flex items-start justify-between gap-3">
      <div><h3 className="text-sm font-bold text-gray-900">Care instructions</h3><p className="mt-1 text-xs text-muted">Add product-level care guidance shown to customers.</p></div>
      <button type="button" onClick={() => onChange([...items, { title: "", description: "", displayOrder: items.length }])} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-brand/20 px-3 text-xs font-semibold text-brand hover:bg-brand-soft"><Plus size={14}/>Add care item</button>
    </div>
    {items.length === 0 && <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">No care instructions added.</p>}
    {items.map((item, index) => <div key={index} className="space-y-3 rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between"><span className="text-xs font-semibold text-gray-600">Care item {index + 1}</span><button type="button" aria-label={`Remove care item ${index + 1}`} onClick={() => void remove(index)} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15}/></button></div>
      <div><label className="mb-1.5 block text-xs font-semibold text-gray-700" htmlFor={`product-care-title-${index}`}>Title <span className="text-red-500">*</span></label><input id={`product-care-title-${index}`} required className={inputClass} value={item.title} onChange={(event) => update(index, { title: event.target.value })} placeholder="e.g. Upholstery care"/></div>
      <div><label className="mb-1.5 block text-xs font-semibold text-gray-700" htmlFor={`product-care-description-${index}`}>Description</label><textarea id={`product-care-description-${index}`} rows={3} className={inputClass} value={item.description ?? ""} onChange={(event) => update(index, { description: event.target.value })} placeholder="Describe how customers should care for this product."/></div>
    </div>)}
  </section>;
}
