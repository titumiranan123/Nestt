"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { DashboardKpiGrid } from "@/components/admin/dashboard/DashboardKpiGrid";
import { AdminRequestState } from "@/components/admin/AdminRequestState";
import { InventoryAlertsCard } from "@/components/admin/dashboard/InventoryAlertsCard";
import { RecentOrdersTable } from "@/components/admin/dashboard/RecentOrdersTable";
import { RevenueOverview } from "@/components/admin/dashboard/RevenueOverview";
import { useDashboard } from "@/features/dashboard/hooks";
import type { DashboardPeriod } from "@/features/dashboard/types";
import { usePermission } from "@/hooks/use-permission";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const showOrders = usePermission("orders:read");
  const showInventory = usePermission("inventory:read");
  const { overview, orders, alerts } = useDashboard(period, showOrders, showInventory);

  return (
    <div className="animate-fade-up space-y-6">
      <DashboardHeader period={period} onPeriodChange={setPeriod} />
      <DashboardKpiGrid metrics={overview.data} />
      <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <RevenueOverview period={period} series={overview.data?.series} feedback={<AdminRequestState request={overview} label="store metrics" />} />
        <InventoryAlertsCard count={overview.data?.lowStock.total} items={showInventory ? alerts.data : undefined}
          feedback={showInventory ? <AdminRequestState request={alerts} label="inventory alerts" /> : "Inventory details require inventory access."}
          showLink={showInventory} />
      </section>
      <RecentOrdersTable orders={showOrders ? orders.data : undefined} showLink={showOrders}
        feedback={showOrders ? <AdminRequestState request={orders} label="recent orders" /> : "Order details require order access."} />
    </div>
  );
}
