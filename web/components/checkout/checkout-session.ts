import type { VariantCartItem } from "@/components/cart/CartProvider";
import type { CheckoutPayment } from "@/lib/account/api";

const key = "nestt-pending-checkout";
export type PendingOrder = {
  id: string; userId: string; signature: string; items: VariantCartItem[];
  paymentMethod?: CheckoutPayment;
  orderId?: string;
};

export function readPendingOrder(): PendingOrder | null {
  try { return JSON.parse(sessionStorage.getItem(key) ?? "null"); }
  catch { return null; }
}

export function storePendingOrder(pending: PendingOrder | null) {
  try {
    if (pending) sessionStorage.setItem(key, JSON.stringify(pending));
    else sessionStorage.removeItem(key);
  } catch { /* In-memory order recovery remains available on this page. */ }
}
