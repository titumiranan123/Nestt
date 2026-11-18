"use client";

import { catalogImageUrl } from "@/lib/catalog";
import type { Address, CustomerOrder, DeliveryDivision, OrderStatus, Product, Profile } from "./types";
import { statusLabel } from "./data";

export class AccountApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const accountSessionEnded = "nestt:account-session-ended";
export function normalizedPhone(input: string) {
  const digits = input.trim().replace(/[\s()-]/g, "");
  if (/^01\d{9}$/.test(digits)) return `+88${digits}`;
  return digits;
}
const prefix = "/api/account";
let refreshInFlight: Promise<Response> | undefined;

async function withSessionLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return await navigator.locks.request("nestt-customer-session", operation);
  }
  return operation();
}

function refreshSession(): Promise<Response> {
  if (!refreshInFlight) {
    const refresh = () => fetch(`${prefix}/session`, { method: "POST", cache: "no-store" });
    refreshInFlight = withSessionLock(refresh).finally(() => { refreshInFlight = undefined; });
  }
  return refreshInFlight;
}

async function accountResponse(path: string, init?: RequestInit, authenticated = true) {
  const request = () => fetch(prefix + path, { ...init, cache: "no-store" });
  let response = await request();
  if (authenticated && response.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed.ok) {
      if (refreshed.status === 401) window.dispatchEvent(new Event(accountSessionEnded));
      throw new AccountApiError(
        refreshed.status === 401 ? "Sign in to continue." : "Could not renew your session. Try again.",
        refreshed.status,
      );
    }
    response = await request();
    if (response.status === 401) window.dispatchEvent(new Event(accountSessionEnded));
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new AccountApiError(body?.message || "Could not complete this request.", response.status);
  }
  return response;
}

async function request<T>(path: string, init?: RequestInit, authenticated?: boolean): Promise<T> {
  const response = await accountResponse(path, init, authenticated);
  return response.status === 204 ? undefined as T : response.json();
}

function json(method: "POST" | "PATCH", body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

type UserResponse = {
  user: { id: string; name: string; email: string | null; phone: string | null; emailVerified: boolean; phoneVerified: boolean };
};

function profileFrom({ user }: UserResponse): Profile {
  return {
    id: user.id, name: user.name, email: user.email ?? "", phone: user.phone ?? "",
    isEmailVerified: user.emailVerified, isPhoneVerified: user.phoneVerified,
  };
}

type AddressRecord = Omit<Address, "thanaId" | "label" | "postalCode"> & {
  thanaId: string | null;
  label: string | null;
  postalCode: string | null;
};

function addressFrom(address: AddressRecord): Address {
  return { ...address, label: address.label || "Address", thanaId: address.thanaId ?? "", postalCode: address.postalCode ?? "" };
}

type OrderRecord = {
  id: string; orderCode: string; createdAt: string; status: OrderStatus;
  paymentStatus: CustomerOrder["payment"];
  contactEmail?: string | null;
  orderPhoneVerifiedAt?: string | null;
  payment?: { method: string } | null;
  cancelReason: string | null;
  items: {
    id: string; variantId: string | null; productName: string; image: string | null;
    variantName: string | null; quantity: number; unitPrice: string | number;
  }[];
  statusHistories: { id: string; status: OrderStatus; note: string | null; createdAt: string }[];
  returns?: { id: string; itemId: string; status: string; reason: string | null; createdAt: string }[];
  shippingName: string; shippingPhone: string; shippingRegion: string; shippingCity: string;
  shippingArea: string; shippingAddress: string; shippingPostalCode: string | null;
  billingSameAsShipping: boolean;
  billingName: string | null; billingPhone: string | null; billingRegion: string | null; billingCity: string | null;
  billingArea: string | null; billingAddress: string | null; billingPostalCode: string | null;
  subTotal: string | number; totalAmount: string | number; shippingCharge: string | number; discountAmount: string | number;
};

function orderFrom(record: OrderRecord): CustomerOrder {
  const paymentMethod = record.payment?.method;
  const cashOnDelivery = paymentMethod === "CASH_ON_DELIVERY";
  const addressDefaults = { id: "", thanaId: "", label: "", isDefaultShipping: false, isDefaultBilling: false };
  return {
    id: record.id, code: record.orderCode, date: record.createdAt, status: record.status,
    payment: record.paymentStatus, cashOnDelivery,
    contactEmail: record.contactEmail ?? null,
    orderPhoneVerifiedAt: record.orderPhoneVerifiedAt ?? null,
    method: paymentMethod === "SSL_COMMERZ" ? "SSLCommerz" : paymentMethod ? statusLabel(paymentMethod) : "Unavailable",
    deliveredAt: record.statusHistories.findLast((entry) => entry.status === "DELIVERED")?.createdAt,
    cancelReason: record.cancelReason ?? undefined,
    shipping: {
      ...addressDefaults, fullName: record.shippingName, phone: record.shippingPhone,
      region: record.shippingRegion, city: record.shippingCity, area: record.shippingArea,
      addressLine: record.shippingAddress, postalCode: record.shippingPostalCode ?? "",
    },
    billing: !record.billingSameAsShipping && record.billingAddress ? {
      ...addressDefaults, fullName: record.billingName ?? "", phone: record.billingPhone ?? "",
      region: record.billingRegion ?? "", city: record.billingCity ?? "", area: record.billingArea ?? "",
      addressLine: record.billingAddress, postalCode: record.billingPostalCode ?? "",
    } : undefined,
    subtotal: Number(record.subTotal), total: Number(record.totalAmount),
    shippingCharge: Number(record.shippingCharge), discount: Number(record.discountAmount),
    items: record.items.map((item) => ({
      id: item.id, variantId: item.variantId, name: item.productName, image: catalogImageUrl(item.image),
      variant: item.variantName ?? "", quantity: item.quantity, price: Number(item.unitPrice),
    })),
    updates: record.statusHistories.map((entry) => ({
      id: entry.id, status: entry.status, note: entry.note, date: entry.createdAt,
    })),
    returns: (record.returns ?? []).map((entry) => ({
      itemId: entry.itemId, reason: entry.reason ?? "", status: entry.status,
      reference: entry.id, date: entry.createdAt,
    })),
  };
}

type WishlistRecord = {
  variantId: string;
  variant: {
    name: string; price: number | string; stockQty: number; stockStatus: string;
    media: { url: string }[];
    product: { id: string; name: string; category: { name: string }; variants: { id: string }[]; isPriceOnRequest: boolean };
  };
};

function wishlistFrom({ variantId, variant }: WishlistRecord): Product {
  const product = variant.product;
  return {
    id: product.id, variantId, name: product.name, category: product.category.name, finish: variant.name,
    price: Number(variant.price), image: catalogImageUrl(variant.media[0]?.url) ?? "/assets/hero/quality-living-room.webp",
    stock: ["IN_STOCK", "LOW_STOCK"].includes(variant.stockStatus) ? variant.stockQty : 0,
    canAddToCart: !product.isPriceOnRequest,
    isPriceOnRequest: product.isPriceOnRequest,
  };
}

type CheckoutItem = { variantId: string; quantity: number };
export type CheckoutPayment = "CASH_ON_DELIVERY" | "SSL_COMMERZ";
export type PaymentOutcome = "success" | "failed" | "cancelled" | "pending";
type CheckoutShippingAddress = {
  thanaId: string; name: string; phone: string; region: string; city: string; area: string; address: string; postalCode: string;
};
type CheckoutCore = {
  items: CheckoutItem[]; checkoutId: string; expectedTotal: number; contactEmail: string;
  emergencyContactPhone: string; paymentMethod: CheckoutPayment;
};
export type CheckoutInput = CheckoutCore & ({ addressId: string } | { shippingAddress: CheckoutShippingAddress });
export type PublicCheckoutInput = CheckoutCore & { shippingAddress: CheckoutShippingAddress };
export type CheckoutQuote = {
  subtotal: string | number;
  shippingCharge: string | number;
  total: string | number;
  items: { variantId: string; lineTotal: string | number }[];
};

export const accountApi = {
  login: (email: string, password: string) => request("/login", json("POST", { email, password }), false),
  requestEmailSignup: (email: string, password: string) =>
    request("/email/signup", json("POST", { email, password }), false),
  verifyEmailSignup: (email: string, code: string, password: string) =>
    request("/email/verify", json("POST", { email, code, password }), false),
  resendEmailSignup: (email: string) =>
    request("/email/resend-verification", json("POST", { email }), false),
  loginWithPhone: (phone: string, password: string) =>
    request("/phone/login", json("POST", { phone, password }), false),
  requestPhoneSignup: (phone: string) =>
    request("/phone/signup", json("POST", { phone }), false),
  verifyPhoneSignup: (phone: string, name: string, code: string, password: string) =>
    request("/phone/signup/verify", json("POST", { phone, name, code, password }), false),
  requestPasswordReset: (phone: string) =>
    request("/phone/forgot-password", json("POST", { phone }), false),
  resetPassword: (phone: string, code: string, password: string) =>
    request("/phone/reset-password", json("POST", { phone, code, password }), false),
  requestPhone: (phone: string) => request("/phone/request", json("POST", { phone }), false),
  verifyPhone: (phone: string, code: string) => request("/phone/verify", json("POST", { phone, code }), false),
  signOut: () => withSessionLock(() => request("/session", { method: "DELETE" }, false)),
  profile: () => request<UserResponse>("/profile").then(profileFrom),
  updateProfile: (name: string) => request<UserResponse>("/profile", json("PATCH", { name })).then(profileFrom),
  requestContactPhoneCode: (phone: string) => request("/link/phone/request", json("POST", { phone })),
  verifyContactPhone: (phone: string, code: string) => request<UserResponse>(
    "/link/phone/verify", json("POST", { phone, code }),
  ).then(profileFrom),
  addresses: () => request<AddressRecord[]>("/addresses").then((rows) => rows.map(addressFrom)),
  deliveryAreas: () => request<DeliveryDivision[]>("/delivery-areas"),
  saveAddress: (address: Address) => {
    const { id, label, fullName, phone, thanaId, addressLine, postalCode, isDefaultShipping, isDefaultBilling } = address;
    const body = { label, fullName, phone, thanaId, addressLine, postalCode: postalCode || null, isDefaultShipping, isDefaultBilling };
    return request(id ? `/addresses/${id}` : "/addresses", json(id ? "PATCH" : "POST", body));
  },
  setDefaultAddress: (id: string) => request(`/addresses/${id}`, json("PATCH", { isDefaultShipping: true })),
  deleteAddress: (id: string) => request(`/addresses/${id}`, { method: "DELETE" }),
  async orders() {
    const pageSize = 100;
    const first = await request<{ items: OrderRecord[]; total: number }>(`/orders?page=1&pageSize=${pageSize}`);
    const orders = new Map(first.items.map((row) => [row.id, orderFrom(row)]));
    for (let page = 2; page <= Math.ceil(first.total / pageSize); page++) {
      const next = await request<{ items: OrderRecord[] }>(`/orders?page=${page}&pageSize=${pageSize}`);
      for (const row of next.items) orders.set(row.id, orderFrom(row));
    }
    return [...orders.values()];
  },
  order: (id: string) => request<OrderRecord>(`/orders/${encodeURIComponent(id)}`).then(orderFrom),
  quoteOrder: (body: { items: CheckoutItem[] } & ({ addressId: string } | { thanaId: string })) =>
    request<CheckoutQuote>("/orders/quote", json("POST", body)),
  publicCheckoutDeliveryAreas: () => request<DeliveryDivision[]>("/checkout/public/delivery-areas", undefined, false),
  quotePublicCheckout: (body: { items: CheckoutItem[]; thanaId: string }) =>
    request<CheckoutQuote>("/checkout/public/quote", json("POST", body), false),
  requestPublicCheckoutCode: (body: PublicCheckoutInput) =>
    request<{ phoneEnding: string }>("/checkout/public/otp", json("POST", body), false),
  completePublicCheckout: (body: PublicCheckoutInput, code: string) =>
    request<{ id: string; orderCode: string }>("/checkout/public/complete", json("POST", { ...body, code }), false),
  requestCheckoutCode: (body: CheckoutInput) =>
    request<{ phoneEnding: string }>("/orders/otp", json("POST", body)),
  placeOrder: (body: CheckoutInput, code: string) =>
    request<{ id: string }>("/orders", json("POST", { ...body, code })),
  recoverCheckout: (id: string) => request<{ id: string | null }>(`/orders/checkout/${encodeURIComponent(id)}`),
  startPayment: (id: string) => request<{ outcome: PaymentOutcome; gatewayUrl?: string }>(`/orders/${encodeURIComponent(id)}/payment`, json("POST", {})),
  checkPayment: (id: string) => request<{ outcome: PaymentOutcome }>(`/orders/${encodeURIComponent(id)}/payment/check`, json("POST", {})),
  cancelOrder: (id: string, reason: string) => request(`/orders/${id}/cancel`, json("POST", { reason })),
  returnItem: (id: string, itemId: string, reason: string) => request(`/orders/${id}/returns`, json("POST", { itemId, reason })),
  invoice: (id: string) => accountResponse(`/orders/${id}/invoice`).then((response) => response.blob()),
  wishlist: () => request<WishlistRecord[]>("/wishlist").then((rows) => rows.map(wishlistFrom)),
  saveWish: (variantId: string) => request(`/wishlist/items/${variantId}`, { method: "PUT" }),
  removeWish: (variantId: string) => request(`/wishlist/items/${variantId}`, { method: "DELETE" }),
};
