import { Check } from "lucide-react";

import type { DemoOrder } from "@/lib/demo-admin-data";

const card = "rounded-lg border border-gray-200 bg-white p-4 sm:p-5";

export function OrderTimeline({ order }: { order: DemoOrder }) {
  return <section className={card}><div><h2 className="text-base font-bold text-gray-950">Order timeline</h2><p className="mt-1 text-sm text-gray-500">Track the progress of this order</p></div><div className="ml-1 mt-5">{order.timeline.map((step, index) => <div className="relative flex min-h-14 gap-3" key={step.label}>{index < order.timeline.length - 1 && <span className={`absolute bottom-0 left-[9px] top-5 w-px ${step.done ? "bg-emerald-200" : "bg-gray-200"}`}/>}<span className={`z-10 grid size-5 shrink-0 place-items-center rounded-full border text-[10px] ${step.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-400"}`}>{step.done ? <Check size={12}/> : index + 1}</span><span><strong className={`block text-sm font-medium ${step.done ? "text-gray-800" : "text-gray-400"}`}>{step.label}</strong><small className="mt-1 block text-xs text-gray-500">{step.date}</small></span></div>)}</div></section>;
}
