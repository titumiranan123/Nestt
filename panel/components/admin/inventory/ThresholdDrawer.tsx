"use client";

import { useState, type FormEvent } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import { useSaveThreshold } from "@/features/inventory/hooks";
import type { InventoryItem } from "@/features/inventory/types";
import { MAX_INVENTORY_QUANTITY } from "@/features/inventory/utils";
import { getErrorMessage } from "@/lib/api/errors";

export function ThresholdDrawer({ item, onClose }: {
  item: InventoryItem | null;
  onClose: () => void;
}) {
  const saveThreshold = useSaveThreshold();
  const close = () => {
    if (saveThreshold.isPending) return;
    saveThreshold.reset();
    onClose();
  };

  return <AdminDrawer open={Boolean(item)} title="Edit alert quantity" description="Set the minimum stock level that should trigger a low-stock alert." onClose={close}>
    {item && <ThresholdForm key={item.id} item={item} mutation={saveThreshold} onClose={close} />}
  </AdminDrawer>;
}

function ThresholdForm({ item, mutation, onClose }: {
  item: InventoryItem;
  mutation: ReturnType<typeof useSaveThreshold>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(item.threshold));
  const threshold = Number(value);
  const valid = value !== "" && Number.isInteger(threshold) && threshold >= 0 && threshold <= MAX_INVENTORY_QUANTITY;
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || mutation.isPending) return;

    try {
      await mutation.mutateAsync({ id: item.id, threshold });
    } catch {
      return;
    }

    onClose();
  };

  return <form className="flex h-full flex-col" onSubmit={save}>
      <div className="flex-1 space-y-5 p-5 sm:p-6">
        <div className="rounded-xl border border-brand/10 bg-brand-soft/50 p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white text-brand"><SlidersHorizontal size={18} /></span><div><p className="text-sm font-bold text-gray-900">{item.product}</p><p className="mt-0.5 text-xs text-gray-500">{item.variant} · {item.sku}</p></div></div></div>
        <label className="block"><span className="text-sm font-semibold text-gray-700">Alert quantity</span><span className="mt-2 flex items-center rounded-xl border border-gray-200 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"><input type="number" min="0" max={MAX_INVENTORY_QUANTITY} required disabled={mutation.isPending} value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-l-xl border-0 bg-transparent px-4 py-3 text-sm outline-none" /><span className="border-l border-gray-200 px-3 text-xs text-gray-500">units</span></span></label>
        <div className="rounded-xl border border-accent/15 bg-orange-50/60 p-4"><p className="text-xs font-bold uppercase tracking-wide text-accent">Available stock: {item.available} units</p><p className="mt-1 text-xs leading-5 text-gray-600">The alert appears whenever available stock reaches this quantity or lower.</p></div>
        {mutation.error && <p role="alert" className="text-xs text-rose-700">{getErrorMessage(mutation.error)}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 p-5"><button type="button" onClick={onClose} disabled={mutation.isPending} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" disabled={!valid || mutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><Save size={15} />{mutation.isPending ? "Saving…" : "Save threshold"}</button></div>
    </form>;
}
