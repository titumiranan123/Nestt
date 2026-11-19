"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getReport, type ReportKind, type ReportPayload } from "@/features/reports/api";
import { ColumnChart, DonutChart, RankedBars, TrendChart } from "./ReportCharts";
const money = (amount: unknown) => `৳${Number(amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString() : "—";
const fmtDate = (value?: string) => value ? new Date(value).toLocaleString() : "—";
const inventoryStatusStyles: Record<string, string> = {
  IN_STOCK: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  LOW_STOCK: "bg-amber-50 text-amber-800 ring-amber-600/20",
  OUT_OF_STOCK: "bg-rose-50 text-rose-700 ring-rose-600/15",
  PREORDER: "bg-sky-50 text-sky-700 ring-sky-600/15",
};

type ReportPage = "sales-revenue" | "products-inventory" | "customers";

const pageConfig: Record<ReportPage, { title: string; tabs: Array<{ kind: ReportKind; label: string }> }> = {
  "sales-revenue": { title: "Sales & Revenue", tabs: [{ kind: "sales", label: "Sales overview" }, { kind: "revenue", label: "Payments & profit" }] },
  "products-inventory": { title: "Products & Inventory", tabs: [{ kind: "products", label: "Product performance" }, { kind: "inventory", label: "Stock health" }] },
  customers: { title: "Customer Insights", tabs: [{ kind: "customers", label: "Customer activity" }] },
};

export default function ReportsPage({ page }: { page: ReportPage }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tabs = pageConfig[page].tabs;
  const view = params.get("view");
  const kind = tabs.find((tab) => tab.kind === view)?.kind ?? (page === "products-inventory" ? "inventory" : tabs[0].kind);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const query = useMemo(() => ({ from: params.get("from") || undefined, to: params.get("to") || undefined, page: Number(params.get("page") || 1), limit: 12, search: params.get("search") || undefined, status: params.get("status") || undefined, paymentStatus: params.get("paymentStatus") || undefined, type: params.get("type") || undefined }), [params]);
  const report = useQuery({ queryKey: ["admin-report", kind, query], queryFn: ({ signal }) => getReport(kind, query, signal), staleTime: 30_000 });
  const data = report.data ?? {};
  const update = (values: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) value ? next.set(key, value) : next.delete(key);
    next.delete("page");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };
  useEffect(() => setSearch(params.get("search") ?? ""), [params]);
  useEffect(() => {
    if (search === (params.get("search") ?? "")) return;
    const timer = window.setTimeout(() => update({ search }), 350);
    return () => window.clearTimeout(timer);
  // URL changes are represented by the current search parameter.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const meta = data.meta ?? { page: 1, totalPages: 1, total: 0, limit: 12 };
  const rows = (data[kind === "sales" ? "orders" : kind === "products" ? "products" : kind === "inventory" ? "inventory" : kind === "customers" ? "customers" : "transactions"] ?? []) as Record<string, any>[];
  const cards = cardValues(kind, data);
  const series = ((kind === "sales" ? data.chart : kind === "customers" ? data.chart : data.trend) ?? []) as Record<string, any>[];
  const chartPoints = series.map((row) => ({ label: row.date ?? row.name ?? "", value: Number(row.revenue ?? row.newCustomers ?? 0), comparison: Number(row.paidRevenue ?? 0) }));
  const categoryBars = ((kind === "products" ? data.categoryDistribution : kind === "revenue" ? data.categories : kind === "sales" ? data.chart : []) ?? []) as Record<string, any>[];
  const statusOptions = kind === "sales" ? [["PENDING", "Pending"], ["CONFIRMED", "Confirmed"], ["PROCESSING", "Processing"], ["SHIPPED", "Shipped"], ["DELIVERED", "Delivered"], ["CANCELLED", "Cancelled"]] : kind === "inventory" ? [["IN_STOCK", "In stock"], ["LOW_STOCK", "Low stock"], ["OUT_OF_STOCK", "Out of stock"], ["PREORDER", "Preorder"]] : kind === "customers" ? [["New", "New customers"], ["Returning", "Returning"]] : kind === "revenue" ? [["CASH_ON_DELIVERY", "Cash on delivery"], ["SSL_COMMERZ", "SSLCommerz"]] : [];
  const inputClass = "rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-secondary";
  return <div className="space-y-4 text-ink">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-gray-500">Reports / <span className="font-semibold text-ink">{pageConfig[page].title}</span></p><h1 className="mt-4 text-3xl font-bold tracking-tight">{pageConfig[page].title}</h1></div>{kind === "inventory" ? <span className="text-sm text-gray-600">◷ Current stock</span> : <div className={`flex items-center gap-2 ${inputClass}`}><input aria-label="From date" type="date" value={query.from ?? ""} onChange={(event) => update({ from: event.target.value })} className="bg-transparent"/><span className="text-gray-400">–</span><input aria-label="To date" type="date" value={query.to ?? ""} onChange={(event) => update({ to: event.target.value })} className="bg-transparent"/></div>}</header>
    {tabs.length > 1 && <nav aria-label={`${pageConfig[page].title} views`} className="flex gap-7 border-b border-line">{tabs.map((tab) => <button key={tab.kind} onClick={() => update({ view: tab.kind, search: "", status: "", type: "", paymentStatus: "" })} className={`border-b-2 px-1 py-3 text-sm font-semibold ${kind === tab.kind ? "border-secondary text-secondary" : "border-transparent text-gray-600 hover:text-ink"}`}>{tab.label}</button>)}</nav>}
    {kind === "sales" && <section className="flex flex-wrap gap-3"><select aria-label="Order status" value={query.status ?? ""} onChange={(event) => update({ status: event.target.value })} className={inputClass}><option value="">All order statuses</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Payment status" value={query.paymentStatus ?? ""} onChange={(event) => update({ paymentStatus: event.target.value })} className={inputClass}><option value="">All payment statuses</option>{[["PAID", "Paid"], ["UNPAID", "Unpaid"], ["PENDING", "Pending"], ["FAILED", "Failed"], ["REFUNDED", "Refunded"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></section>}
    {kind === "inventory" && <section className="flex flex-wrap gap-3"><input aria-label="Search inventory" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or SKU" className={`${inputClass} min-w-64 flex-1`}/><select aria-label="Stock status" value={query.status ?? ""} onChange={(event) => update({ status: event.target.value })} className={inputClass}><option value="">All stock statuses</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></section>}
    {kind === "products" && <section><input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or SKU" className={`${inputClass} w-full`}/></section>}
    {kind === "customers" && <section className="flex flex-wrap gap-3"><input aria-label="Search customers" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone" className={`${inputClass} min-w-64 flex-1`}/><select aria-label="Customer type" value={query.type ?? ""} onChange={(event) => update({ type: event.target.value })} className={inputClass}><option value="">All customer types</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></section>}
    {kind === "revenue" && <section><select aria-label="Payment method" value={query.type ?? ""} onChange={(event) => update({ type: event.target.value })} className={inputClass}><option value="">All payment methods</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></section>}
    {report.isError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{report.error instanceof Error ? report.error.message : "Unable to load this report."}<button onClick={() => report.refetch()} className="ml-3 font-semibold underline">Try again</button></div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-2xl border border-line bg-white p-5 shadow-sm"><p className="text-sm font-medium text-gray-600">{card.label}</p><div className="mt-2 truncate text-2xl font-bold">{card.value}</div></div>)}</section>
    <ChartPanels kind={kind} data={data} chartPoints={chartPoints} categoryBars={categoryBars}/>
    <ReportTable kind={kind} rows={rows} loading={report.isLoading} />
    <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-3 text-sm text-gray-600"><span>Page {meta.page} of {Math.max(1, meta.totalPages)} · {Number(meta.total).toLocaleString()} records</span><div className="flex gap-2"><button disabled={Number(meta.page) <= 1} onClick={() => update({ page: String(Number(meta.page) - 1) })} className="rounded-lg border border-line px-3 py-2 font-semibold disabled:opacity-40">Previous</button><button disabled={Number(meta.page) >= Number(meta.totalPages)} onClick={() => { const next = new URLSearchParams(params.toString()); next.set("page", String(Number(meta.page) + 1)); router.replace(`${pathname}?${next}`, { scroll: false }); }} className="rounded-lg border border-line px-3 py-2 font-semibold disabled:opacity-40">Next</button></div></footer>
  </div>;
}

function cardValues(kind: ReportKind, data: ReportPayload) {
  const s = data.summary ?? {};
  const values: Record<ReportKind, Array<[string, string]>> = {
    sales: [["Total Sales", money(s.totalSales)], ["Total Orders", Number(s.totalOrders ?? 0).toLocaleString()], ["Items Sold", Number(s.totalItems ?? 0).toLocaleString()], ["Avg Order Value", money(s.averageOrderValue)]],
    products: [["Total Products", Number(s.totalProducts ?? 0).toLocaleString()], ["Top Selling", s.topSelling ?? "—"], ["Units Sold", Number(s.totalUnitsSold ?? 0).toLocaleString()], ["Product Revenue", money(s.productRevenue)]],
    inventory: [["Total Variants", Number(s.total ?? 0).toLocaleString()], ["In Stock", Number(s.inStock ?? 0).toLocaleString()], ["Low Stock", Number(s.lowStock ?? 0).toLocaleString()], ["Out of Stock", Number(s.outOfStock ?? 0).toLocaleString()]],
    customers: [["Total Customers", Number(s.totalCustomers ?? 0).toLocaleString()], ["New Customers", Number(s.newCustomers ?? 0).toLocaleString()], ["Returning", Number(s.returningCustomers ?? 0).toLocaleString()], ["Top Customer Spend", money(s.topCustomerRevenue)]],
    revenue: [["Total Revenue", money(s.totalRevenue)], ["Estimated Cost", money(s.totalCost)], ["Net Profit", money(s.netProfit)], ["Profit Margin", `${Number(s.profitMargin ?? 0).toFixed(1)}%`]],
  };
  return values[kind].map(([label, value]) => ({ label, value }));
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) { return <section className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}><h2 className="mb-1 text-lg font-bold">{title}</h2>{children}</section>; }

function ChartPanels({ kind, data, chartPoints, categoryBars }: { kind: ReportKind; data: ReportPayload; chartPoints: { label: string; value: number }[]; categoryBars: Record<string, any>[] }) {
  if (kind === "inventory") return <ChartCard title="Stock Health"><DonutChart center={String(data.summary?.total ?? 0)} data={[{ label: "In stock", value: Number(data.summary?.inStock ?? 0), color: "#55a987" }, { label: "Low stock", value: Number(data.summary?.lowStock ?? 0), color: "#e6a944" }, { label: "Out of stock", value: Number(data.summary?.outOfStock ?? 0), color: "#dd6670" }]}/></ChartCard>;
  if (kind === "products") return <div className="grid gap-4 xl:grid-cols-2"><ChartCard title="Top Products by Units"><RankedBars data={(data.topProducts ?? []).map((item: any) => ({ label: item.name, value: Number(item.units ?? 0) }))} label="Units"/></ChartCard><ChartCard title="Sales by Category"><DonutChart center={String((data.summary?.totalUnitsSold ?? 0).toLocaleString())} data={categoryBars.map((item, index) => ({ label: item.name, value: Number(item.value ?? 0), color: ["#e96855", "#5488d8", "#55a987", "#e6a944", "#9972cc"][index % 5] }))}/></ChartCard></div>;
  if (kind === "customers") return <div className="grid gap-4 xl:grid-cols-2"><ChartCard title="New registrations over time"><ColumnChart data={chartPoints.map((point) => ({ ...point, label: dateLabel(point.label) }))} label="New customers" color="#e96855"/></ChartCard><ChartCard title="Purchasing customers"><DonutChart center={String(data.summary?.totalCustomers ?? 0)} data={(data.composition ?? []).map((item: any, index: number) => ({ label: item.name, value: Number(item.value ?? 0), color: index ? "#55adba" : "#08779a" }))}/></ChartCard></div>;
  if (kind === "revenue") return <div className="grid gap-4 xl:grid-cols-3"><ChartCard title="Revenue Trend" className="xl:col-span-2"><TrendChart data={chartPoints.map((point) => ({ ...point, label: dateLabel(point.label) }))} label="Revenue"/></ChartCard><ChartCard title="Payment Methods"><DonutChart center={money(data.summary?.totalRevenue)} data={(data.paymentMethods ?? []).map((item: any, index: number) => ({ label: item.name, value: Number(item.value ?? 0), color: ["#e96855", "#5488d8", "#55a987"][index % 3] }))}/></ChartCard><ChartCard title="Revenue by Category" className="xl:col-span-3"><RankedBars data={categoryBars.map((item) => ({ label: item.name, value: Number(item.value ?? 0) }))} label="Revenue"/></ChartCard></div>;
  return <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]"><ChartCard title="Order value & paid revenue"><TrendChart data={chartPoints.map((point) => ({ ...point, label: dateLabel(point.label) }))} label="Order value" comparisonLabel="Paid revenue"/></ChartCard><ChartCard title="Orders by status"><RankedBars data={(data.statusDistribution ?? []).map((item: any) => ({ label: item.name, value: Number(item.value) }))} label="Orders"/></ChartCard></div>;
}

function ReportTable({ kind, rows, loading }: { kind: ReportKind; rows: Record<string, any>[]; loading: boolean }) {
  const configs: Record<ReportKind, { title: string; columns: Array<{ name: string; cell: (row: Record<string, any>) => React.ReactNode }> }> = {
    sales: { title: "Recent Transactions", columns: [{ name: "Order", cell: (r) => <span className="font-mono text-xs">{r.id}</span> }, { name: "Customer", cell: (r) => <><b>{r.customer}</b><small className="block text-gray-500">{r.email}</small></> }, { name: "Date", cell: (r) => fmtDate(r.date) }, { name: "Amount", cell: (r) => <b>{money(r.amount)}</b> }, { name: "Payment", cell: (r) => r.paymentStatus }, { name: "Status", cell: (r) => r.orderStatus }, { name: "Items", cell: (r) => r.items }] },
    products: { title: "Product Performance", columns: [{ name: "Product", cell: (r) => <div className="flex items-center gap-3">{r.image && <Image src={r.image} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover"/>}<b>{r.name}</b></div> }, { name: "Category", cell: (r) => r.category }, { name: "Units Sold", cell: (r) => r.unitsSold }, { name: "Revenue", cell: (r) => money(r.revenue) }, { name: "Stock Left", cell: (r) => r.stock }] },
    inventory: { title: "Inventory Status", columns: [{ name: "Product", cell: (r) => <><b>{r.name}</b><small className="block text-gray-500">{r.variantName} · {r.category}</small></> }, { name: "SKU", cell: (r) => r.sku }, { name: "Qty", cell: (r) => r.quantity }, { name: "Reserved", cell: (r) => r.reservedStockQty }, { name: "Alert Qty", cell: (r) => r.lowStockAlertQty }, { name: "Status", cell: (r) => { const status = String(r.status); return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${inventoryStatusStyles[status] ?? "bg-gray-100 text-gray-700 ring-gray-600/15"}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current"/>{status.replaceAll("_", " ")}</span>; } }, { name: "Updated", cell: (r) => fmtDate(r.lastUpdated) }] },
    customers: { title: "Customer Activity", columns: [{ name: "Customer", cell: (r) => <><b>{r.name}</b><small className="block text-gray-500">{r.email}</small></> }, { name: "Type", cell: (r) => r.type }, { name: "Orders", cell: (r) => r.totalOrders }, { name: "Total Spent", cell: (r) => money(r.totalSpent) }, { name: "Last Order", cell: (r) => fmtDate(r.lastOrderDate) }, { name: "Joined", cell: (r) => fmtDate(r.joinDate) }] },
    revenue: { title: "Recent Revenue Transactions", columns: [{ name: "Transaction", cell: (r) => <span className="font-mono text-xs">{r.id}</span> }, { name: "Source", cell: (r) => r.source }, { name: "Customer", cell: (r) => r.customer }, { name: "Amount", cell: (r) => <b className="text-green-700">+{money(r.amount)}</b> }, { name: "Method", cell: (r) => r.method }, { name: "Date", cell: (r) => fmtDate(r.date) }] },
  };
  const config = configs[kind];
  return <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"><h2 className="border-b border-line p-5 text-lg font-bold">{config.title}</h2><div className="overflow-x-auto"><table className="w-full min-w-max text-left text-sm"><thead className="border-b border-line bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500"><tr>{config.columns.map((column) => <th className="px-5 py-4" key={column.name}>{column.name}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{loading ? <tr><td colSpan={config.columns.length} className="px-5 py-12 text-center text-gray-500">Loading report…</td></tr> : rows.length === 0 ? <tr><td colSpan={config.columns.length} className="px-5 py-12 text-center text-gray-500">No report data found for the selected filters.</td></tr> : rows.map((row, index) => <tr key={row.id ?? index} className="hover:bg-gray-50/70">{config.columns.map((column) => <td key={column.name} className="px-5 py-4">{column.cell(row)}</td>)}</tr>)}</tbody></table></div></section>;
}
