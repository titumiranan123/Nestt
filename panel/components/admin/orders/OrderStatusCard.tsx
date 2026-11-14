import type { OrderStatus } from "@/lib/demo-admin-data";

import { OrderStatusPill } from "./OrderStatusPill";

const card = "rounded-lg border border-gray-200 bg-white p-4 sm:p-5";

export function OrderStatusCard({ status, pendingStatus, updated, onPendingChange, onUpdate }: { status: OrderStatus; pendingStatus: OrderStatus; updated: boolean; onPendingChange: (status: OrderStatus) => void; onUpdate: () => void }) {
  return <section className={card}><div><h2 className="text-base font-bold text-gray-950">Order status</h2><p className="mt-1 text-sm text-gray-500">Update the fulfillment stage</p></div><div className="mt-4"><OrderStatusPill status={status}/></div><label className="mb-1 mt-4 block text-sm font-medium text-gray-700" htmlFor="status-select">Change status</label><select id="status-select" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand" value={pendingStatus} onChange={(event) => onPendingChange(event.target.value as OrderStatus)}>{["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"].map((value) => <option key={value}>{value}</option>)}</select><button className="mt-3 h-10 w-full rounded-lg bg-brand px-3 text-sm font-semibold text-white transition hover:bg-brand-dark" onClick={onUpdate}>Update order</button><p className="mt-2 text-center text-xs text-gray-500">{updated ? "Demo status updated for this session." : "Demo only · status changes are temporary"}</p></section>;
}
