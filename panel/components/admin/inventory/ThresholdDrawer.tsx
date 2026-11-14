"use client";

import { useEffect, useState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import type { InventoryItem } from "@/lib/inventory-media-demo";
import { showAdminNotice } from "@/lib/admin-swal";

export function ThresholdDrawer({ item, onClose, onSave }: {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (id: string, threshold: number) => void;
}) {
  const [threshold, setThreshold] = useState(0);
  useEffect(() => { setThreshold(item?.threshold ?? 0); }, [item]);
  const saveThreshold = () => {
    if (!item || threshold < 0) return;
    onSave(item.id, threshold);
    onClose();
    void showAdminNotice("Alert quantity updated", `${item.product} will show a low-stock alert at ${threshold} units.`, "success");
  };

  return <AdminDrawer open={Boolean(item)} title="Edit alert quantity" description="Set the minimum stock level that should trigger a low-stock alert." onClose={onClose}>
    {item && <form className="flex h-full flex-col" onSubmit={(event) => { event.preventDefault(); saveThreshold(); }}>
      <div className="flex-1 space-y-5 p-5 sm:p-6">
        <div className="rounded-xl border border-brand/10 bg-brand-soft/50 p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white text-brand"><SlidersHorizontal size={18} /></span><div><p className="text-sm font-bold text-gray-900">{item.product}</p><p className="mt-0.5 text-xs text-gray-500">{item.variant} · {item.sku}</p></div></div></div>
        <label className="block"><span className="text-sm font-semibold text-gray-700">Alert quantity</span><span className="mt-2 flex items-center rounded-xl border border-gray-200 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"><input type="number" min="0" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="w-full rounded-l-xl border-0 bg-transparent px-4 py-3 text-sm outline-none" /><span className="border-l border-gray-200 px-3 text-xs text-gray-500">units</span></span></label>
        <div className="rounded-xl border border-accent/15 bg-orange-50/60 p-4"><p className="text-xs font-bold uppercase tracking-wide text-accent">Current stock: {item.stock} units</p><p className="mt-1 text-xs leading-5 text-gray-600">The alert appears whenever available stock reaches this quantity or lower.</p></div>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 p-5"><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"><Save size={15} />Save threshold</button></div>
    </form>}
  </AdminDrawer>;
}
