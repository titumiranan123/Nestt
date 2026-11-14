import type { OrderStatus } from "@/lib/demo-admin-data";

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const tone = status === "Processing" ? "border-amber-200 bg-amber-50 text-amber-800" : status === "Delivered" ? "border-green-200 bg-green-50 text-green-800" : status === "Shipped" ? "border-purple-200 bg-purple-50 text-purple-800" : status === "Cancelled" ? "border-red-200 bg-red-50 text-red-800" : "border-sky-200 bg-sky-50 text-sky-800";
  return <span className={`inline-flex rounded border px-2 py-1 text-[10px] font-bold ${tone}`}>{status}</span>;
}
