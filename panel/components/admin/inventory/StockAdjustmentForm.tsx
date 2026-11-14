"use client";

import { useState, type FormEvent } from "react";
import { ArrowDownUp, Check, CircleHelp } from "lucide-react";
import type { AdjustmentItem, AdjustmentType, InventoryItem } from "@/lib/inventory-media-demo";

export function StockAdjustmentForm({ items, onRecord }: {
  items: InventoryItem[];
  onRecord: (adjustment: AdjustmentItem) => void;
}) {
  const [variantId, setVariantId] = useState(items[0]?.id ?? "");
  const [type, setType] = useState<AdjustmentType>("PURCHASE");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const submitAdjustment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const item = items.find((entry) => entry.id === variantId);
    if (!item || !quantity || !reason.trim()) return;
    const signedQuantity = ["SALE", "DAMAGE", "TRANSFER"].includes(type) ? -Math.abs(quantity) : Math.abs(quantity);
    onRecord({ id: `ADJ-${Date.now().toString().slice(-5)}`, variantId, sku: item.sku, product: item.product, variant: item.variant, type, quantity: signedQuantity, reason: reason.trim(), user: "You", createdAt: new Date().toISOString() });
    setQuantity(1);
    setReason("");
  };

  return <section className="h-fit rounded-2xl border border-brand/10 bg-white shadow-sm xl:sticky xl:top-5">
    <header className="border-b border-gray-100 p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><ArrowDownUp size={18} /></span><div><h2 className="text-base font-bold text-gray-900">Quick adjustment</h2><p className="mt-0.5 text-xs text-gray-500">Record a manual stock movement</p></div></div></header>
    <form onSubmit={submitAdjustment} className="space-y-4 p-5">
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">Product variant</span><select value={variantId} onChange={(event) => setVariantId(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10">{items.map((item) => <option key={item.id} value={item.id}>{item.product} · {item.variant}</option>)}</select></label>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">Movement type</span><select value={type} onChange={(event) => setType(event.target.value as AdjustmentType)} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10">{["PURCHASE", "SALE", "RETURN", "CORRECTION", "DAMAGE", "TRANSFER"].map((value) => <option key={value} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>)}</select></label>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">Quantity</span><div className="flex h-10 items-center rounded-lg border border-gray-200 focus-within:border-brand"><span className={`px-3 text-sm font-bold ${["SALE", "DAMAGE", "TRANSFER"].includes(type) ? "text-accent" : "text-brand"}`}>{["SALE", "DAMAGE", "TRANSFER"].includes(type) ? "−" : "+"}</span><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="h-full w-full border-0 bg-transparent text-sm outline-none" /><span className="px-3 text-xs text-gray-400">units</span></div></label>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">Reason</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Add a note for the audit trail" className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
      <div className="flex gap-2 rounded-lg bg-orange-50/70 p-3 text-xs leading-5 text-gray-600"><CircleHelp size={15} className="mt-0.5 shrink-0 text-accent" />This demo updates the on-screen stock only. No inventory API is connected.</div>
      <button type="submit" disabled={!variantId || !quantity || !reason.trim()} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><Check size={16} />Record adjustment</button>
    </form>
  </section>;
}
