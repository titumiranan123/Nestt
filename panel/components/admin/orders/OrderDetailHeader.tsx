import { MoreHorizontal, Printer } from "lucide-react";

import type { DemoOrder } from "@/lib/demo-admin-data";

export function OrderDetailHeader({ order, onMoreActions }: { order: DemoOrder; onMoreActions: () => void }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">Order details</p><h1 className="text-2xl font-bold text-gray-950">{order.id}</h1><p className="mt-1 text-sm text-gray-500">Placed on {order.date} <span className="px-1 text-gray-300">•</span> {order.items.reduce((sum, item) => sum + item.quantity, 0)} item</p></div><div className="flex flex-wrap items-center gap-2"><button className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50" onClick={() => window.print()}><Printer size={16} strokeWidth={1.8}/>Print order</button><button className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50" onClick={onMoreActions}><MoreHorizontal size={17} strokeWidth={1.8}/>More actions</button></div></div>;
}
