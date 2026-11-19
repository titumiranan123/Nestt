import { Box, CircleAlert, Layers3, ShoppingBag, TrendingDown, TrendingUp, UsersRound, Wallet } from "lucide-react";
import { formatDashboardMoney, formatPeriodChange } from "@/features/dashboard/format";
import type { DashboardOverview } from "@/features/dashboard/types";

const number = new Intl.NumberFormat("en-BD");

export function DashboardKpiGrid({ metrics }: { metrics?: DashboardOverview }) {
  const revenueChange = metrics && formatPeriodChange(Number(metrics.revenue.total), Number(metrics.revenue.previous));
  const orderChange = metrics && formatPeriodChange(metrics.orders.total, metrics.orders.previous);
  const kpis = [
    { label: "Total revenue", value: metrics && formatDashboardMoney(metrics.revenue.total), change: revenueChange ?? "No prior revenue", note: revenueChange && "vs. prior period", icon: Wallet, accent: false, trend: metrics && Number(metrics.revenue.total) - Number(metrics.revenue.previous) },
    { label: "Total orders", value: metrics && number.format(metrics.orders.total), change: orderChange ?? "No prior orders", note: orderChange && "vs. prior period", icon: ShoppingBag, accent: true, trend: metrics && metrics.orders.total - metrics.orders.previous },
    { label: "Total products", value: metrics && number.format(metrics.products.total), change: metrics && `${number.format(metrics.products.added)} added`, note: "in this period", icon: Box, accent: false, trend: metrics?.products.added },
    { label: "Total customers", value: metrics && number.format(metrics.customers.total), change: metrics && `${number.format(metrics.customers.added)} joined`, note: "in this period", icon: UsersRound, accent: true, trend: metrics?.customers.added },
    { label: "Low stock items", value: metrics && number.format(metrics.lowStock.total), change: metrics?.lowStock.total ? "Needs attention" : "Stock levels healthy", note: metrics?.lowStock.total ? `across ${number.format(metrics.lowStock.categories)} ${metrics.lowStock.categories === 1 ? "category" : "categories"}` : "", icon: Layers3, accent: false },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5" aria-label="Store metrics">
      {kpis.map(({ label, value, change, note, icon: Icon, accent, trend }) => {
        const ChangeIcon = trend == null ? CircleAlert : trend < 0 ? TrendingDown : TrendingUp;

        return (
          <article key={label} className={`relative flex min-h-32 min-w-0 items-center gap-4 overflow-hidden rounded-lg border border-t-[3px] border-gray-200 bg-white ${accent ? "border-t-accent" : "border-t-brand"} p-4 sm:p-5`}>
            <div className={`grid size-12 shrink-0 place-items-center rounded-full ${accent ? "bg-orange-50 text-accent" : "bg-brand-soft text-brand"}`}>
              <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-500">{label}</p>
              <p className={`mt-1 truncate text-[22px] font-bold leading-tight ${accent ? "text-accent" : "text-brand-dark"}`}>{value ?? "—"}</p>
              {metrics && <p className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${accent || trend == null || trend < 0 ? "text-accent" : "text-brand"}`}>
                <ChangeIcon size={13} aria-hidden="true" />{change}<span className="font-medium text-gray-500">{note}</span>
              </p>}
            </div>
          </article>
        );
      })}
    </section>
  );
}
