"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { DashboardKpiGrid } from "@/components/admin/dashboard/DashboardKpiGrid";
import { InventoryAlertsCard } from "@/components/admin/dashboard/InventoryAlertsCard";
import { RecentOrdersTable } from "@/components/admin/dashboard/RecentOrdersTable";
import { RevenueOverview } from "@/components/admin/dashboard/RevenueOverview";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState("Last 30 days");
  return (
    <div className="animate-fade-up space-y-6">
      <DashboardHeader period={period} onPeriodChange={setPeriod} />
      <DashboardKpiGrid />
      <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <RevenueOverview period={period} />
        <InventoryAlertsCard />
      </section>
      <RecentOrdersTable />
    </div>
  );
}
