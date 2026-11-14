import type { DemoOrder } from "@/lib/demo-admin-data";

import { OrderRow } from "./OrderRow";

export function OrdersTable({ orders, expanded, onToggle }: { orders: DemoOrder[]; expanded: Record<string, boolean>; onToggle: (id: string) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-brand/10 bg-brand-soft/55 text-xs font-bold uppercase tracking-wide text-brand"><tr><th className="px-5 py-4"><input className="size-4 accent-accent" type="checkbox" aria-label="Select all orders"/></th><th className="px-3 py-4">Order ID</th><th className="px-3 py-4">Customer</th><th className="px-3 py-4">Amount</th><th className="px-3 py-4 text-center">Status</th><th className="px-3 py-4 text-center">Payment</th><th className="px-3 py-4">Delivery</th><th className="px-3 py-4">Date</th><th className="px-3 py-4"/></tr></thead><tbody className="divide-y divide-gray-100">{orders.map((order) => <OrderRow key={order.id} order={order} expanded={Boolean(expanded[order.id])} onToggle={() => onToggle(order.id)}/>)}{orders.length === 0 && <tr><td colSpan={9} className="h-32 px-5 text-center text-sm text-gray-500">No orders match these filters. Try changing your search.</td></tr>}</tbody></table></div>;
}
