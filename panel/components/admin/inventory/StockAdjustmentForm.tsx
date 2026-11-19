"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowDownUp, Check, CircleHelp } from "lucide-react";
import { useRecordAdjustment } from "@/features/inventory/hooks";
import { adjustmentLabels, type AdjustmentType, type InventoryVariant } from "@/features/inventory/types";
import { adjustmentDirection, MAX_INVENTORY_QUANTITY } from "@/features/inventory/utils";
import { getErrorMessage } from "@/lib/api/errors";

export function StockAdjustmentForm({ items, loading }: {
  items?: InventoryVariant[];
  loading: boolean;
}) {
  const movement = useRecordAdjustment();
  const attempt = useRef<{ id: string; signature: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [type, setType] = useState<AdjustmentType>("RESTOCK");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const variantId = selectedVariant
    ? items?.find(({ id }) => id === selectedVariant)?.id ?? ""
    : items?.[0]?.id ?? "";
  const direction = adjustmentDirection(type);
  const amount = Number(quantity);
  const min = direction === 0 ? -MAX_INVENTORY_QUANTITY : 1;
  const sign = direction < 0 ? "−" : direction > 0 ? "+" : "±";
  const valid = Boolean(variantId && reason.trim()) && Number.isInteger(amount) && amount !== 0 && amount >= min && amount <= MAX_INVENTORY_QUANTITY;

  const submitAdjustment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || movement.isPending) return;

    const input = { variantId, type, quantity: direction === 0 ? amount : direction * amount, reason: reason.trim() };
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature) attempt.current = { id: crypto.randomUUID(), signature };

    try {
      await movement.mutateAsync({ id: attempt.current.id, ...input });
    } catch {
      return;
    }

    attempt.current = null;
    setQuantity("1");
    setReason("");
  };

  return <section className="h-fit rounded-2xl border border-brand/10 bg-white shadow-sm xl:sticky xl:top-5">
    <header className="border-b border-gray-100 p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><ArrowDownUp size={18} /></span><div><h2 className="text-base font-bold text-gray-900">Quick adjustment</h2><p className="mt-0.5 text-xs text-gray-500">Record a manual stock movement</p></div></div></header>
    <form onSubmit={submitAdjustment} className="space-y-4 p-5">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-gray-700">Product variant</span>
        <select value={variantId} disabled={!items?.length || movement.isPending} onChange={(event) => setSelectedVariant(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10">
          {!variantId && <option value="" disabled>
            {loading ? "Loading variants…" : items?.length ? "Select a product variant" : "No variants available"}
          </option>}
          {items?.map((item) => <option key={item.id} value={item.id}>{item.product} · {item.variant} · {item.sku}</option>)}
        </select>
      </label>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">Movement type</span><select value={type} disabled={movement.isPending} onChange={(event) => {
        setType(event.target.value as AdjustmentType);
        if (amount < 0) setQuantity(String(-amount));
      }} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10">{Object.entries(adjustmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">Quantity</span><div className="flex h-10 items-center rounded-lg border border-gray-200 focus-within:border-brand"><span className={`px-3 text-sm font-bold ${direction < 0 ? "text-accent" : "text-brand"}`}>{sign}</span><input type="number" min={min} max={MAX_INVENTORY_QUANTITY} required disabled={movement.isPending} value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-full w-full border-0 bg-transparent text-sm outline-none" /><span className="px-3 text-xs text-gray-400">units</span></div></label>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">Reason</span><textarea value={reason} required maxLength={255} disabled={movement.isPending} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Add a note for the audit trail" className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
      <div className="flex gap-2 rounded-lg bg-orange-50/70 p-3 text-xs leading-5 text-gray-600"><CircleHelp size={15} className="mt-0.5 shrink-0 text-accent" />{direction === 0 ? "Enter a positive quantity to add stock or a negative quantity to remove it." : "Adjustments update available stock and are saved in the movement log."}</div>
      {movement.error && <p role="alert" className="text-xs text-rose-700">{getErrorMessage(movement.error)}</p>}
      <button type="submit" disabled={!valid || movement.isPending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><Check size={16} />{movement.isPending ? "Recording…" : "Record adjustment"}</button>
    </form>
  </section>;
}
