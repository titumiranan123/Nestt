import { apiClient } from "@/lib/api/client";

export type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrder: number | null;
  maxDiscount: number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  userLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

export type CouponInput = Omit<Coupon, "id" | "usedCount">;

const path = "/admin/coupons";
const json = (method: "POST" | "PATCH", body: unknown) => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const couponsApi = {
  list: (signal?: AbortSignal) => apiClient<Coupon[]>(path, { signal }),
  create: (input: CouponInput) => apiClient<Coupon>(path, json("POST", input)),
  update: (id: string, input: CouponInput) => apiClient<Coupon>(`${path}/${id}`, json("PATCH", input)),
  remove: (id: string) => apiClient<{ id: string; deleted: boolean }>(`${path}/${id}`, { method: "DELETE" }),
};
