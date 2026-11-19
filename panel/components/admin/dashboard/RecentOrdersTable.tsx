import Link from "next/link";
import type { ReactNode } from "react";
import AdminIcon from "@/components/admin/AdminIcon";
import { OrderStatusPill } from "@/components/admin/orders/OrderStatusPill";
import { formatDashboardDate, formatDashboardMoney } from "@/features/dashboard/format";
import type { DashboardOrder } from "@/features/dashboard/types";
import type { PaymentStatus } from "@/features/orders/types";

const paymentLabels: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid", PENDING: "Pending", PAID: "Paid", FAILED: "Failed", PARTIALLY_REFUNDED: "Partially refunded", REFUNDED: "Refunded",
};

export function RecentOrdersTable({ orders, feedback, showLink }: {
  orders?: DashboardOrder[];
  feedback: ReactNode;
  showLink: boolean;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-t-[3px] border-gray-200 border-t-brand bg-white">
      <div className="flex items-center justify-between gap-3 bg-brand-soft/35 px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand">Latest activity</p>
          <h2 className="mt-1 text-base font-bold text-brand-dark">Recent Orders</h2>
          <p className="mt-1 text-sm text-gray-500">Your most recent customer orders for the selected period.</p>
        </div>
        {showLink && <Link href="/admin/orders" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-700">View all orders <AdminIcon name="chev" size={14} /></Link>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-y border-brand/10 bg-brand-soft/50 text-xs font-bold uppercase tracking-wide text-brand">
            <tr>
              <th className="px-5 py-3">Order ID</th><th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders?.map((order) => {
              const href = `/admin/orders/${order.id}`;
              const initials = order.shippingName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

              return (
                <tr key={order.id} className="transition-colors hover:bg-brand-soft/40">
                  <td className="px-5 py-4"><Link href={href} className="font-semibold text-brand">{order.orderCode}</Link></td>
                  <td className="px-4 py-4"><div className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">{initials}</span>
                    <span className="font-medium text-gray-800">{order.shippingName}</span>
                  </div></td>
                  <td className="whitespace-nowrap px-4 py-4 text-gray-500">{formatDashboardDate(order.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-bold text-brand-dark">{formatDashboardMoney(order.totalAmount)}</td>
                  <td className="px-4 py-4"><span className={`mr-2 inline-block size-2 rounded-full ${order.paymentStatus === "PAID" ? "bg-brand" : "bg-accent"}`} />{paymentLabels[order.paymentStatus]}</td>
                  <td className="px-4 py-4"><OrderStatusPill status={order.status} /></td>
                  <td className="px-3 py-4"><Link href={href} aria-label={`Open ${order.orderCode}`} className="text-accent hover:text-brand"><AdminIcon name="chev" size={16} /></Link></td>
                </tr>
              );
            })}
            {!orders && <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">{feedback}</td></tr>}
            {orders?.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">No orders in this period.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
