import { Mail, Phone } from "lucide-react";

import type { DemoOrder } from "@/lib/demo-admin-data";

const card = "rounded-lg border border-gray-200 bg-white p-4 sm:p-5";

export function CustomerCard({ order }: { order: DemoOrder }) {
  const initials = order.customer.split(" ").map((part) => part[0]).join("");
  return <section className={card}><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-gray-950">Customer</h2><p className="mt-1 text-sm text-gray-500">Customer information</p></div><button className="text-xs font-semibold text-brand">View profile</button></div><div className="mt-4 flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{initials}</span><div className="min-w-0"><strong className="block text-sm font-semibold text-gray-900">{order.customer}</strong><small className="mt-1 block text-xs text-gray-500">Customer since Mar 2025</small></div></div><div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600"><p className="flex min-w-0 items-center gap-2 truncate"><Mail size={15} className="shrink-0 text-gray-400"/>{order.email}</p><p className="flex items-center gap-2"><Phone size={15} className="shrink-0 text-gray-400"/>{order.phone}</p></div></section>;
}
