import { CreditCard } from "lucide-react";

import type { DemoOrder } from "@/lib/demo-admin-data";

import { money } from "@/lib/demo-admin-data";

const card = "rounded-lg border border-gray-200 bg-white p-4 sm:p-5";

export function PaymentCard({ order }: { order: DemoOrder }) {
  const paymentTone = order.payment === "Paid" ? "bg-emerald-50 text-emerald-700" : order.payment === "Pending" ? "bg-amber-50 text-amber-800" : "bg-purple-50 text-purple-700";
  return <section className={card}><div><h2 className="text-base font-bold text-gray-950">Payment</h2><p className="mt-1 text-sm text-gray-500">Payment method and status</p></div><div className="mt-4 flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><CreditCard size={18}/></span><div className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold text-gray-800">{order.method}</strong><small className="mt-1 block text-xs text-gray-500">{order.payment === "Paid" ? "Paid on " : `${order.payment} · `}{order.date}</small></div><span className={`inline-flex rounded px-2 py-1 text-[10px] font-medium ${paymentTone}`}>{order.payment}</span></div><div className="mt-4 flex justify-between border-t border-gray-100 pt-3 text-sm"><span className="text-gray-500">Amount paid</span><strong className="font-bold text-gray-900">{money(order.total)}</strong></div></section>;
}
