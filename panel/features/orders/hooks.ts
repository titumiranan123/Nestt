"use client";

import { queryOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard/keys";
import { inventoryKeys } from "@/features/inventory/keys";
import { productKeys } from "@/features/products/keys";
import { ordersApi } from "./api";
import type { OrderFilters, OrderStatus, PaymentActionStatus, ReturnActionStatus } from "./types";

const orderKeys = {
  all: ["admin", "orders"] as const,
  detail: (id: string) => ["admin", "orders", "detail", id] as const,
  list: (filters: OrderFilters) => ["admin", "orders", "list", filters] as const,
};

export const orderQueries = {
  list: (filters: OrderFilters) => queryOptions({ queryKey: orderKeys.list(filters), queryFn: ({ signal }) => ordersApi.list(filters, signal) }),
  detail: (id: string) => queryOptions({ queryKey: orderKeys.detail(id), queryFn: ({ signal }) => ordersApi.get(id, signal) }),
};

function refreshOrderData(client: QueryClient, stockChanged: boolean) {
  return Promise.all([
    client.invalidateQueries({ queryKey: orderKeys.all }),
    client.invalidateQueries({ queryKey: dashboardKeys.overview }),
    client.invalidateQueries({ queryKey: dashboardKeys.recentOrders }),
    ...(stockChanged ? [
      client.invalidateQueries({ queryKey: inventoryKeys.list }),
      client.invalidateQueries({ queryKey: productKeys.all }),
      client.invalidateQueries({ queryKey: dashboardKeys.inventoryAlerts }),
    ] : []),
  ]);
}

export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.create,
    meta: { successMessage: "Order created." },
    onSuccess: (order) => {
      client.setQueryData(orderKeys.detail(order.id), order);
      return refreshOrderData(client, true);
    },
  });
}

export function useOrderActions(id: string) {
  const client = useQueryClient();
  const queryKey = orderKeys.detail(id);
  const status = useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) => ordersApi.updateStatus(id, status, note),
    onSuccess: (order) => {
      client.setQueryData(queryKey, order);
      return refreshOrderData(client, order.status === "CANCELLED");
    },
    meta: { successMessage: "Order status updated." },
  });
  const payment = useMutation({
    mutationFn: ({ status, reference }: { status: PaymentActionStatus; reference?: string }) => ordersApi.updatePayment(id, status, reference),
    onSuccess: () => refreshOrderData(client, false),
    meta: { successMessage: "Payment status updated." },
  });
  const remark = useMutation({
    mutationFn: ({ note, isInternal }: { note: string; isInternal: boolean }) => ordersApi.addRemark(id, note, isInternal),
    onSuccess: () => client.invalidateQueries({ queryKey }),
    meta: { successMessage: "Remark saved." },
  });
  const orderReturn = useMutation({
    mutationFn: ({ returnId, status }: { returnId: string; status: ReturnActionStatus }) => ordersApi.updateReturn(returnId, status),
    onSuccess: () => client.invalidateQueries({ queryKey }),
    meta: { successMessage: "Return status updated." },
  });
  return { status, payment, remark, orderReturn };
}
