import { CirclePlus, Download } from "lucide-react";

import AdminIcon from "@/components/admin/AdminIcon";

export function OrdersHeader({ onExport, onCreate }: { onExport: () => void; onCreate?: () => void }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-brand/10    p-4 sm:flex-row sm:items-center sm:px-5">
      <div>
        <p className="mb-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-brand">
          <span className="size-1.5 rounded-full bg-accent" />
          Order workspace
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
          Orders
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Monitor order flow, payment state, and fulfillment actions from a
          single operations table.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onCreate && <button type="button" onClick={onCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"><CirclePlus size={16}/>Create order</button>}
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
          onClick={onExport}
        >
          <Download size={16} strokeWidth={1.8} /> Export Orders
        </button>
        <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand/15 bg-white px-3 text-sm font-semibold text-brand">
          <AdminIcon name="calendar" size={15} />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
