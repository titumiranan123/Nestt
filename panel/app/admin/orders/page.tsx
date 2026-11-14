"use client";

import { useMemo, useState } from "react";
import { demoOrders, money } from "@/lib/demo-admin-data";
import { DemoOrdersNote } from "@/components/admin/orders/DemoOrdersNote";
import { OrderStatsGrid } from "@/components/admin/orders/OrderStatsGrid";
import { OrdersFilters } from "@/components/admin/orders/OrdersFilters";
import { OrdersHeader } from "@/components/admin/orders/OrdersHeader";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";

const pageSize = 6;

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [payment, setPayment] = useState("All payments");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const filtered = useMemo(() => demoOrders.filter((order) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [order.id, order.customer, order.email, order.phone].some((field) => field.toLowerCase().includes(query));
    return matchesQuery && (status === "All statuses" || order.status === status) && (payment === "All payments" || order.payment === payment);
  }), [search, status, payment]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const stats: Array<[string, string, string]> = [
    ["Total orders", demoOrders.length.toString(), "↗ 8.2% this month"],
    ["Processing", demoOrders.filter((order) => order.status === "Processing").length.toString(), "Awaiting fulfillment"],
    ["Payment pending", demoOrders.filter((order) => order.payment === "Pending").length.toString(), "Follow up required"],
    ["Revenue", money(demoOrders.filter((order) => order.payment === "Paid").reduce((sum, order) => sum + order.total, 0)), "From paid orders"],
  ];
  const exportOrders = () => {
    const header = ["Order ID", "Customer", "Amount", "Status", "Payment", "Date"];
    const content = [header, ...filtered.map((order) => [order.id, order.customer, String(order.total), order.status, order.payment, order.date])].map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "nestt-demo-orders.csv"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const changeFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  const resetFilters = () => { setStatus("All statuses"); setPayment("All payments"); setSearch(""); setPage(1); };

  return <div className="animate-fade-up space-y-6">
    <OrdersHeader onExport={exportOrders}/>
    <OrderStatsGrid stats={stats}/>
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <OrdersFilters search={search} status={status} payment={payment} onSearch={(value) => changeFilter(setSearch, value)} onStatus={(value) => changeFilter(setStatus, value)} onPayment={(value) => changeFilter(setPayment, value)} onReset={resetFilters}/>
      <OrdersTable orders={rows} expanded={expanded} onToggle={(id) => setExpanded((current) => ({ ...current, [id]: !current[id] }))}/>
      <TablePagination total={filtered.length} page={page} pageSize={pageSize} pageCount={pages} itemLabel="orders" onPage={setPage}/>
    </section>
    <DemoOrdersNote/>
  </div>;
}
