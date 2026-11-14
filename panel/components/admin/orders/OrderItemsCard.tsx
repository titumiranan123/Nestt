import type { DemoOrder } from "@/lib/demo-admin-data";

import { money } from "@/lib/demo-admin-data";

const card = "rounded-lg border border-gray-200 bg-white p-4 sm:p-5";

export function OrderItemsCard({ order, itemTotal }: { order: DemoOrder; itemTotal: number }) {
  const summary = [
    { label: "Subtotal", value: money(itemTotal), tone: "text-gray-800" },
    { label: "Delivery", value: money(500), tone: "text-gray-800" },
    { label: "Discount", value: `−${money(500)}`, tone: "text-emerald-700" },
  ];

  return <section className={card}><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-gray-950">Items ordered</h2><p className="mt-1 text-sm text-gray-500">{order.items.length} product in this order</p></div><span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">{order.id}</span></div><div className="mt-4 border-t border-gray-100">{order.items.map((item) => <div className="flex min-h-20 items-center gap-3 border-b border-gray-100" key={item.sku}><div className="grid size-12 shrink-0 place-items-center rounded-lg bg-orange-50"><span className="h-7 w-6 rounded border border-amber-800 bg-amber-300"/></div><div className="min-w-0 flex-1"><strong className="block text-sm font-semibold text-gray-800">{item.name}</strong><small className="mt-1 block text-xs text-gray-500">SKU: {item.sku} · Color: {item.color}</small></div><span className="whitespace-nowrap text-sm text-gray-500">× {item.quantity}</span><strong className="min-w-20 text-right text-sm text-gray-900">{money(item.price * item.quantity)}</strong></div>)}</div><div className="ml-auto mt-4 grid max-w-xs gap-3 text-sm">{summary.map(({ label, value, tone }) => <div key={label} className="flex justify-between text-gray-500"><span>{label}</span><strong className={`font-medium ${tone}`}>{value}</strong></div>)}<div className="flex justify-between border-t border-gray-200 pt-3 font-semibold text-gray-900"><span>Total</span><strong className="text-base font-bold">{money(order.total)}</strong></div></div></section>;
}
