"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { OrderCreateDrawer } from "@/components/admin/orders/OrderCreateDrawer";
import { OrderStatsGrid } from "@/components/admin/orders/OrderStatsGrid";
import { OrdersFilters } from "@/components/admin/orders/OrdersFilters";
import { OrdersHeader } from "@/components/admin/orders/OrdersHeader";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { orderQueries } from "@/features/orders/hooks";
import type { OrderStatus, PaymentStatus } from "@/features/orders/types";
import { usePermission } from "@/hooks/use-permission";
import { getErrorMessage } from "@/lib/api/errors";

const pageSize = 20;
const money = (amount: number) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(amount);

export default function OrdersPage() {
  const router = useRouter();
  const canCreate = usePermission("orders:create");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const searchTerm = useDeferredValue(search.trim());
  const orders = useQuery(orderQueries.list({
    page,
    pageSize,
    status: status ? status as OrderStatus : undefined,
    paymentStatus: payment ? payment as PaymentStatus : undefined,
    search: searchTerm || undefined,
  }));

  const exportOrders = () => {
    const header = ["Order ID", "Customer", "Phone", "Amount", "Status", "Payment", "Created at"];
    const lines = (orders.data?.items ?? []).map((order) => [order.orderCode, order.shippingName, order.shippingPhone, String(order.totalAmount), order.status, order.paymentStatus, order.createdAt]);
    const content = [header, ...lines].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "nestt-orders.csv"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const resetFilters = () => { setSearch(""); setStatus(""); setPayment(""); setPage(1); };
  const stats: Array<[string, string, string]> = [
    ["Total orders", String(orders.data?.summary.total ?? 0), "All catalog orders"],
    ["Processing", String(orders.data?.summary.processing ?? 0), "Awaiting fulfillment"],
    ["Payment pending", String(orders.data?.summary.paymentPending ?? 0), "Follow up required"],
    ["Paid revenue", money(Number(orders.data?.summary.paidRevenue ?? 0)), "From paid orders"],
  ];

  if (orders.isPending) return <AdminLoadingSkeleton kind="page" label="Loading orders" />;
  if (orders.isError) return <div className="space-y-5"><OrdersHeader onExport={exportOrders} onCreate={canCreate ? () => setCreateOpen(true) : undefined}/><section role="alert" className="rounded-xl border border-red-200 bg-white p-8 text-center"><h2 className="font-semibold text-gray-900">Could not load orders</h2><p className="mt-2 text-sm text-gray-600">{getErrorMessage(orders.error)}</p><button type="button" onClick={() => void orders.refetch()} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Try again</button></section><OrderCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(order) => { setCreateOpen(false); router.push(`/admin/orders/${order.id}`); }}/></div>;

  return <div className="animate-fade-up space-y-6">
    <OrdersHeader onExport={exportOrders} onCreate={canCreate ? () => setCreateOpen(true) : undefined}/>
    <OrderStatsGrid stats={stats}/>
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <OrdersFilters search={search} status={status} payment={payment} onSearch={(value) => { setSearch(value); setPage(1); }} onStatus={(value) => { setStatus(value); setPage(1); }} onPayment={(value) => { setPayment(value); setPage(1); }} onReset={resetFilters}/>
      {orders.isFetching && <p role="status" className="sr-only">Refreshing orders</p>}
      <OrdersTable orders={orders.data.items}/>
      <TablePagination total={orders.data.total} page={orders.data.page} pageSize={orders.data.pageSize} pageCount={Math.max(1, Math.ceil(orders.data.total / orders.data.pageSize))} itemLabel="orders" onPage={setPage}/>
    </section>
    <OrderCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(order) => { setCreateOpen(false); router.push(`/admin/orders/${order.id}`); }}/>
  </div>;
}
