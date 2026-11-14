import { MapPin } from "lucide-react";

import type { DemoOrder } from "@/lib/demo-admin-data";

const card = "rounded-lg border border-gray-200 bg-white p-4 sm:p-5";

export function DeliveryAddressCard({ order }: { order: DemoOrder }) {
  return <section className={card}><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-gray-950">Delivery address</h2><p className="mt-1 text-sm text-gray-500">Shipping destination</p></div><button className="text-xs font-semibold text-brand">Edit</button></div><div className="mt-4 flex gap-2 text-sm leading-6 text-gray-600"><MapPin size={17} className="mt-1 shrink-0 text-gray-400"/><div><strong className="font-semibold text-gray-800">{order.customer}</strong><p>{order.address}<br/>{order.city}, Bangladesh<br/>1205</p><span className="mt-2 inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Home</span></div></div></section>;
}
