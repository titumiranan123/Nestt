import { Box, CircleAlert, Layers3, ShoppingBag, TrendingUp, UsersRound, Wallet } from "lucide-react";

import { money } from "@/lib/demo-admin-data";

const card = "min-w-0 rounded-lg border border-gray-200 bg-white";

export function DashboardKpiGrid() {
  const kpis = [
    { label: "Total revenue", value: 842750, change: "+12.8%", note: "vs. last month", icon: Wallet, color: "brand" },
    { label: "Total orders", value: 1284, change: "+8.2%", note: "vs. last month", icon: ShoppingBag, color: "accent" },
    { label: "Total products", value: 186, change: "+3.1%", note: "vs. last month", icon: Box, color: "brand" },
    { label: "Total customers", value: 946, change: "+5.4%", note: "vs. last month", icon: UsersRound, color: "accent" },
    { label: "Low stock items", value: 12, change: "Needs attention", note: "across 4 categories", icon: Layers3, color: "brand" },
  ];
  return <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5" aria-label="Store metrics">{kpis.map(({ label, value, change, note, icon: Icon, color }) => { const accent = color === "accent"; return <article className={`${card} relative flex min-h-32 items-center gap-4 overflow-hidden border-t-[3px] ${accent ? "border-t-accent" : "border-t-brand"} p-4 sm:p-5`} key={label}><div className={`grid size-12 shrink-0 place-items-center rounded-full ${accent ? "bg-orange-50 text-accent" : "bg-brand-soft text-brand"}`}><Icon aria-hidden="true" size={24} strokeWidth={1.7}/></div><div className="min-w-0"><p className="text-sm font-semibold text-gray-500">{label}</p><p className={`mt-1 truncate text-[22px] font-bold leading-tight ${accent ? "text-accent" : "text-brand-dark"}`}>{label === "Total revenue" ? money(value) : value.toLocaleString("en-BD")}</p><p className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${change.startsWith("+") ? (accent ? "text-accent" : "text-brand") : "text-accent"}`}>{change.startsWith("+") ? <TrendingUp size={13}/> : <CircleAlert size={13} />}{change}<span className="font-medium text-gray-500"> {note}</span></p></div></article>; })}</section>;
}
