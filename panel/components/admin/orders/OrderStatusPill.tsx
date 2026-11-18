import type { OrderStatus } from "@/features/orders/types";
import type { OrderStatus as DemoOrderStatus } from "@/lib/demo-admin-data";

export function OrderStatusPill({ status }: { status: OrderStatus | DemoOrderStatus }) {
  const normalized = status.toUpperCase() as OrderStatus;
  const tone = normalized === "PROCESSING" ? "border-amber-200 bg-amber-50 text-amber-800" : normalized === "DELIVERED" ? "border-green-200 bg-green-50 text-green-800" : normalized === "SHIPPED" ? "border-purple-200 bg-purple-50 text-purple-800" : normalized === "CANCELLED" ? "border-red-200 bg-red-50 text-red-800" : "border-sky-200 bg-sky-50 text-sky-800";
  const label = status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`inline-flex rounded border px-2 py-1 text-[10px] font-bold ${tone}`}>{label}</span>;
}
