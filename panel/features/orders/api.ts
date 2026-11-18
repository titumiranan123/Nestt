import { apiClient } from "@/lib/api/client";
import type { AdminOrderInput, OrderFilters, OrderPage, OrderRecord, PaymentActionStatus, OrderStatus } from "./types";

export type DeliveryAreas = Array<{ id: string; name: string; districts: Array<{ id: string; name: string; thanas: Array<{ id: string; name: string; deliveryZone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA"; shippingFee: string | null; freeDeliveryAbove: string | null; isDeliverable: boolean }> }> }>;

const json = (body: unknown) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const ordersApi = {
  list(filters: OrderFilters) {
    const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) });
    if (filters.status) params.set("status", filters.status);
    if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
    if (filters.search) params.set("search", filters.search);
    return apiClient<OrderPage>(`/admin/orders?${params.toString()}`);
  },
  get: (id: string) => apiClient<OrderRecord>(`/admin/orders/${id}`),
  create: (input: AdminOrderInput) => apiClient<OrderRecord>("/admin/orders", json(input)),
  updateStatus: (id: string, status: OrderStatus, note?: string) => apiClient<OrderRecord>(`/admin/orders/${id}/status`, { ...json({ status, note, isPublic: true }), method: "PATCH" }),
  updatePayment: (id: string, status: PaymentActionStatus, reference?: string) => apiClient(`/admin/orders/${id}/payment`, { ...json({ status, reference }), method: "PATCH" }),
  addRemark: (id: string, note: string, isInternal: boolean) => apiClient(`/admin/orders/${id}/remarks`, json({ note, isInternal })),
  updateReturn: (returnId: string, status: "APPROVED" | "REJECTED" | "RECEIVED", note?: string) => apiClient(`/admin/orders/returns/${returnId}`, { ...json({ status, note }), method: "PATCH" }),
  deliveryAreas: () => apiClient<DeliveryAreas>("/admin/orders/delivery-areas"),
};
