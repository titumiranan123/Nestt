import { CheckCircle2, Clock3 } from "lucide-react";

import type { DemoOrder, OrderStatus } from "@/lib/demo-admin-data";

import { OrderStatusPill } from "./OrderStatusPill";

export function OrderStatusBanner({ order, status }: { order: DemoOrder; status: OrderStatus }) {
  const tone = status === "Delivered" ? "bg-green-50 text-green-700" : status === "Cancelled" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  const BadgeIcon = status === "Delivered" ? CheckCircle2 : Clock3;
  return <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:items-center"><div className={`grid size-10 shrink-0 place-items-center rounded-full ${tone}`}><BadgeIcon size={20}/></div><div className="min-w-0 flex-1"><strong className="text-sm font-semibold text-gray-900">This order is {status.toLowerCase()}</strong><p className="mt-1 text-sm text-gray-500">{status === "Processing" ? "Review the items and confirm this order to begin fulfillment." : `The order status was last updated on ${order.date}.`}</p></div><OrderStatusPill status={status}/></div>;
}
