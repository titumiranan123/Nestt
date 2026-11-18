"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { accountApi, AccountApiError, type PaymentOutcome } from "@/lib/account/api";
import { authHref } from "@/lib/account/auth-navigation";
import { money } from "@/lib/account/data";
import type { CustomerOrder } from "@/lib/account/types";
import { CheckoutResult } from "./CheckoutResult";
import { CheckoutInvoiceButton } from "./CheckoutInvoiceButton";
import { readPendingOrder, storePendingOrder } from "./checkout-session";

function orderOutcome(order: CustomerOrder): PaymentOutcome {
  if (order.payment === "FAILED" && order.cancelReason !== "SSLCommerz payment cancelled") return "failed";
  if (order.status === "CANCELLED") return "cancelled";
  if (["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(order.payment) || order.cashOnDelivery) return "success";
  return "pending";
}

export function OrderConfirmation({ id, expected, addressSaveFailed }: { id: string; expected: PaymentOutcome; addressSaveFailed: boolean }) {
  const router = useRouter();
  const { removeOrderedItems } = useCart();
  const [order, setOrder] = useState<CustomerOrder>();
  const [failure, setFailure] = useState<number>();
  const [activeAction, setActiveAction] = useState<"check" | "resume">();
  const [notice, setNotice] = useState("");
  const outcome = order && orderOutcome(order);

  useEffect(() => {
    let active = true;
    accountApi.order(id).then((value) => { if (active) setOrder(value); }).catch((error) => {
      if (active) setFailure(error instanceof AccountApiError ? error.status : 500);
    });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!outcome || outcome === "pending") return;
    const pending = readPendingOrder();
    if (pending?.orderId !== id) return;
    if (outcome === "success") {
      try { removeOrderedItems(pending.items); } catch { /* The confirmed order remains available. */ }
    }
    storePendingOrder(null);
  }, [id, outcome, removeOrderedItems]);

  async function paymentAction(action: "check" | "resume") {
    if (activeAction) return;
    setActiveAction(action);
    setNotice("");
    try {
      if (action === "resume") {
        const result = await accountApi.startPayment(id);
        if (result.gatewayUrl) {
          window.location.assign(result.gatewayUrl);
          return;
        }
      } else {
        await accountApi.checkPayment(id);
      }
      const current = await accountApi.order(id);
      setOrder(current);
      const next = orderOutcome(current);
      if (next !== "pending") router.replace(`/checkout/${next}/${id}`);
      else setNotice("SSLCommerz has not confirmed the outcome yet.");
    } catch {
      setNotice("SSLCommerz is unavailable right now. Try again shortly.");
    } finally {
      setActiveAction(undefined);
    }
  }

  if (!order) {
    return <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-xl font-semibold">
        {failure === 401 ? "Sign in to view your order" : failure === 404 ? "Order not found" :
          failure ? "Couldn’t load the order confirmation" : "Loading order…"}
      </h1>
      {failure && <Link className="mt-4 inline-block text-sm font-semibold text-[#af3b17] underline"
        href={failure === 401 ? authHref("/login", `/checkout/${expected}/${id}`) : "/account/orders"}>
        {failure === 401 ? "Sign in" : "View your orders"}
      </Link>}
    </main>;
  }

  const invoice = { orderId: order.id, orderCode: order.code };
  if (outcome === "pending") {
    return <main className="mx-auto max-w-lg px-4 py-20">
      <section className="border border-[#e7e5e0] bg-white p-6">
        <h1 className="text-2xl font-semibold">{expected === "cancelled" ? "Payment cancellation pending" : "Payment outcome pending"}</h1>
        <p className="mt-2 text-sm leading-6 text-[#666]">SSLCommerz is still confirming the outcome for order {order.code}.</p>
        <p className="mt-4 text-sm font-semibold">{money(order.total)}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled={!!activeAction} onClick={() => void paymentAction("check")}
            className="cursor-pointer bg-[#e55324] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {activeAction === "check" ? "Checking…" : "Check payment status"}
          </button>
          {expected !== "success" && <button type="button" disabled={!!activeAction} onClick={() => void paymentAction("resume")}
            className="cursor-pointer border border-[#e7e5e0] px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {activeAction === "resume" ? "Opening…" : "Continue to SSLCommerz"}
          </button>}
          {(expected === "failed" || expected === "cancelled") && <CheckoutInvoiceButton {...invoice}
            className="cursor-pointer border border-[#e7e5e0] px-4 py-2 text-sm font-semibold disabled:opacity-50" />}
        </div>
        {notice && <p role="status" className="mt-3 text-sm text-[#666]">{notice}</p>}
        <Link href={`/account/orders/${order.id}`} className="mt-5 inline-block text-sm text-[#af3b17] underline">View order</Link>
      </section>
    </main>;
  }

  const summary = {
    items: order.items.map(({ id, name, variant, quantity, price, image }) => ({
      id, name, variant, quantity, image, lineTotal: quantity * price,
    })),
    delivery: order.shippingCharge,
    total: order.total,
  };
  if (outcome === "failed") return <CheckoutResult status="failed" summary={summary} invoice={invoice}
    orderHref={`/account/orders/${order.id}`} orderActionLabel="View my order" />;
  if (outcome === "cancelled") return <CheckoutResult status="cancelled" summary={summary} invoice={invoice}
    orderHref={`/account/orders/${order.id}`} orderActionLabel="View my order" />;
  return <CheckoutResult status="success" summary={summary} invoice={invoice} confirmation={{
    orderNumber: order.code,
    orderHref: `/account/orders/${order.id}`,
    paymentLabel: order.cashOnDelivery ? "Cash on Delivery" : order.method,
    payOnDelivery: order.cashOnDelivery && order.payment !== "PAID",
    addressSaveFailed,
  }} />;
}
