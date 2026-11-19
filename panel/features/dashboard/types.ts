import type { OrderStatus, PaymentStatus } from "@/features/orders/types";

export const dashboardPeriods = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  year: "This year",
} as const;

export type DashboardPeriod = keyof typeof dashboardPeriods;

export type RevenuePoint = { start: string; amount: string };

export type DashboardOverview = {
  revenue: { total: string; previous: string };
  orders: { total: number; previous: number };
  products: { total: number; added: number };
  customers: { total: number; added: number };
  lowStock: { total: number; categories: number };
  series: RevenuePoint[];
};

export type DashboardOrder = {
  id: string;
  orderCode: string;
  shippingName: string;
  totalAmount: string;
  createdAt: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
};

export type DashboardStockAlert = { sku: string; product: string; available: number };
