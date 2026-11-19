"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { dashboardKeys } from "./keys";
import type { DashboardOrder, DashboardOverview, DashboardPeriod, DashboardStockAlert } from "./types";

const dashboardQueryOptions = { staleTime: 0, refetchOnWindowFocus: true, meta: { silent: true } } as const;

export function useDashboard(period: DashboardPeriod, showOrders: boolean, showInventory: boolean) {
  const query = new URLSearchParams({ period });
  const overview = useQuery({
    ...dashboardQueryOptions,
    queryKey: [...dashboardKeys.overview, period],
    queryFn: ({ signal }) => apiClient<DashboardOverview>(`${endpoints.dashboard.overview}?${query}`, { signal }),
  });
  const orders = useQuery({
    ...dashboardQueryOptions,
    queryKey: [...dashboardKeys.recentOrders, period],
    queryFn: ({ signal }) => apiClient<DashboardOrder[]>(`${endpoints.dashboard.recentOrders}?${query}`, { signal }),
    enabled: showOrders,
  });
  const alerts = useQuery({
    ...dashboardQueryOptions,
    queryKey: dashboardKeys.inventoryAlerts,
    queryFn: ({ signal }) => apiClient<DashboardStockAlert[]>(endpoints.dashboard.inventoryAlerts, { signal }),
    enabled: showInventory,
  });

  return { overview, orders, alerts };
}
