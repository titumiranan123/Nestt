"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { accountApi, AccountApiError } from "@/lib/account/api";
import { downloadOrderInvoice } from "@/lib/account/download-invoice";
import { useAccount } from "./AccountProvider";
import { Badge, EmptyState, Icon, Modal, PageHeading } from "./ui";
import { DeliveryTimeline } from "./DeliveryTimeline";
import { dateLabel, money, orderTotal, statusLabel } from "@/lib/account/data";
import type { Address, CustomerOrder } from "@/lib/account/types";

export function AddressDisplay({ address }: { address: Address }) {
  return (
    <address className="address-display">
      <strong>{address.fullName}</strong>
      <span>
        {address.addressLine}, {address.area}
      </span>
      <span>
        {address.city}, {address.region} {address.postalCode}
      </span>
      <span>Bangladesh</span>
      <a href={`tel:${address.phone}`}>{address.phone}</a>
    </address>
  );
}

export function OrderDetailsPage({ id }: { id: string }) {
  const [result, setResult] = useState<{ order?: CustomerOrder; error?: string; notFound?: boolean }>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void accountApi.order(id).then((order) => {
      if (active) setResult({ order });
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof AccountApiError && error.status === 404) setResult({ notFound: true });
      else setResult({ error: "Couldn’t load your order details." });
    });
    return () => { active = false; };
  }, [id, attempt]);

  const refresh = () => setAttempt((value) => value + 1);
  if (result.error) {
    return <EmptyState title={result.error} description="Check your connection and try again." action={
      <button className="account-button primary" onClick={() => { setResult({}); refresh(); }}>Try again</button>
    } />;
  }
  if (result.notFound) {
    return <EmptyState title="We couldn’t find that order." description="Check the order number or return to your orders." action={
      <Link href="/account/orders" className="account-button primary">Back to orders</Link>
    } />;
  }
  if (!result.order) return <p className="account-note" role="status">Loading your order…</p>;
  return <OrderDetails order={result.order} refresh={refresh} />;
}

function OrderDetails({ order, refresh }: { order: CustomerOrder; refresh: () => void }) {
  const { cancelOrder, returnItem, busy, notify } = useAccount();
  const [dialog, setDialog] = useState<"cancel" | "return" | "tracking" | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [itemId, setItemId] = useState("");
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const cancelled = order.status === "CANCELLED";
  const delivered = order.status === "DELIVERED";
  const canCancel =
    ["PENDING", "CONFIRMED"].includes(order.status) &&
    order.payment !== "PAID";
  const returnable = order.items.filter(
    (i) => !order.returns.some((r) => r.itemId === i.id && r.status !== "REJECTED"),
  );
  const updates = [...order.updates].reverse();
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim() || busy) return;
    const details = note.trim() ? `${reason} — ${note.trim()}` : reason;
    const saved = dialog === "cancel"
      ? await cancelOrder(order.id, reason)
      : !!itemId && await returnItem(order.id, itemId, details);
    if (saved) {
      refresh();
      setDialog(null);
    }
  }

  async function downloadInvoice() {
    setInvoiceBusy(true);
    try {
      await downloadOrderInvoice(order.id, order.code);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn’t download the invoice.", true);
    } finally {
      setInvoiceBusy(false);
    }
  }
  function openReturn() {
    setItemId(returnable[0]?.id ?? "");
    setReason("");
    setNote("");
    setDialog("return");
  }
  return (
    <>
      <Link href="/account/orders" className="text-link back-to-orders">
        ← Back to orders
      </Link>
      <PageHeading
        title={`Order #${order.code}`}
        description={`Placed on ${dateLabel(order.date)}`}
        action={
          <button className="account-button" disabled={invoiceBusy} onClick={() => void downloadInvoice()}>
            <Icon name="download" size={16} />
            {invoiceBusy ? "Downloading…" : "Download invoice"}
          </button>
        }
      />
      <div className="order-detail-badges">
        <Badge tone={order.status.toLowerCase()}>
          {statusLabel(order.status)}
        </Badge>
        <Badge tone={order.payment.toLowerCase()}>
          {statusLabel(order.payment)}
        </Badge>
      </div>
      <section className="tracking-panel">
        <h2 className="account-section-title">
          {cancelled
            ? "This order has been cancelled."
            : delivered
              ? "A little more home, delivered."
              : order.status === "SHIPPED"
                ? "Your furniture is on its way."
                : "Something lovely is in the making."}
        </h2>
        <p>
          {cancelled
            ? (order.cancelReason ?? "This order will not be delivered.")
            : delivered
              ? order.deliveredAt ? `Delivered on ${dateLabel(order.deliveredAt)}` : "Delivered"
              : "Check your delivery updates for the latest progress."}
        </p>
        {!cancelled && <DeliveryTimeline status={order.status} />}
        {!cancelled && (
          <div className="tracking-provider">
            <span>
              <Icon name="truck" />
              {statusLabel(order.status)}
            </span>
            <button
              className="account-button"
              onClick={() => setDialog("tracking")}
            >
              Delivery updates <Icon name="arrow" size={15} />
            </button>
          </div>
        )}
      </section>
      <div className="order-detail-grid">
        <div>
          <section className="account-card">
            <h2 className="account-section-title">Your pieces</h2>
            {order.items.map((item) => (
              <div className="order-detail-item" key={item.id}>
                <Image
                  src={item.image ?? "/assets/hero/quality-living-room.webp"}
                  alt={item.name}
                  width={220}
                  height={165}
                  unoptimized
                />
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.variant} / Qty {item.quantity}
                  </p>
                  <strong>{money(item.price * item.quantity)}</strong>
                </div>
              </div>
            ))}
          </section>
          <div className="order-address-grid">
            <section className="account-card">
              <h2>
                <Icon name="pin" size={18} />
                Shipping address
              </h2>
              <AddressDisplay address={order.shipping} />
              {order.contactEmail && <p className="account-note">Order updates go to {order.contactEmail}.</p>}
              {order.orderPhoneVerifiedAt && <p className="account-note">Order phone verified at checkout</p>}
              {!order.cashOnDelivery && order.payment === "PENDING" && order.orderPhoneVerifiedAt &&
                <Link className="text-link" href={`/checkout/pending/${order.id}`}>Check payment status</Link>}
            </section>
            <section className="account-card">
              <h2>
                <Icon name="box" size={18} />
                Billing address
              </h2>
              {order.billing ? <AddressDisplay address={order.billing} /> : (
                <p className="account-note">Same as shipping address</p>
              )}
            </section>
          </div>
        </div>
        <section className="account-card order-summary">
          <h2 className="account-section-title">Order summary</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>
                {money(order.subtotal)}
              </dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>
                {order.shippingCharge
                  ? money(order.shippingCharge)
                  : "Complimentary"}
              </dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>{order.discount ? `−${money(order.discount)}` : money(0)}</dd>
            </div>
            <div className="summary-total">
              <dt>Total</dt>
              <dd>{money(orderTotal(order))}</dd>
            </div>
          </dl>
          <div className="summary-payment">
            <h3>Payment</h3>
            <div>
              <strong>{order.method}</strong>
              <Badge tone={order.payment.toLowerCase()}>
                {statusLabel(order.payment)}
              </Badge>
            </div>
            {order.cashOnDelivery && order.payment === "UNPAID" && !cancelled && (
              <p>
                Please pay {money(orderTotal(order))} when your order arrives.
              </p>
            )}
            {order.payment === "REFUNDED" && (
              <p>This order has been refunded.</p>
            )}
          </div>
        </section>
      </div>
      <div className="order-detail-bottom">
        <section className="account-card">
          <h2 className="account-section-title">Delivery updates</h2>
          {updates.length === 0 ? (
            <p className="account-note">
              Updates will appear here when your order status changes.
            </p>
          ) : (
            <ol className="delivery-updates">
              {updates.map((u, i) => (
                <li key={u.id}>
                  <span className={i === 0 ? "current" : ""} />
                  <div>
                    <strong>{statusLabel(u.status)}</strong>
                    <p>{dateLabel(u.date)}{u.note ? ` · ${u.note}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="account-card order-help">
          <h2 className="account-section-title">
            <Icon name="help" />
            Need help with this order?
          </h2>
          <p>Get in touch with our team about your furniture or delivery.</p>
          <a
            className="account-button primary"
            href={`mailto:hello@nestt.com?subject=${encodeURIComponent(`Help with order ${order.code}`)}`}
          >
            Contact Nestt <Icon name="arrow" size={15} />
          </a>
          {canCancel ? (
            <button
              className="text-link"
              onClick={() => {
                setReason("");
                setDialog("cancel");
              }}
            >
              Cancel order
            </button>
          ) : (
            !cancelled &&
            !delivered && (
              <p className="order-policy">
                {order.payment === "PAID"
                  ? "Paid orders require support assistance for cancellation."
                  : "This order can no longer be cancelled online."}
              </p>
            )
          )}
          {delivered && returnable.length > 0 && (
            <button className="account-button" onClick={openReturn}>
              Request a return
            </button>
          )}
        </section>
      </div>
      {order.returns.length > 0 && (
        <section className="account-card return-summary">
          <h2 className="account-section-title">Your return requests</h2>
          {order.returns.map((r) => (
            <div key={r.reference}>
              <Badge tone={r.status === "REJECTED" ? "cancelled" : r.status === "REQUESTED" ? "pending" : "good"}>{statusLabel(r.status)}</Badge>
              <strong>{r.reference}</strong>
              <p>
                {order.items.find((i) => i.id === r.itemId)?.name} · {r.reason}
              </p>
              <p className="account-note">
                Requested on {dateLabel(r.date)}
              </p>
            </div>
          ))}
        </section>
      )}
      {dialog === "tracking" && (
        <Modal title="Your delivery journey" onClose={() => setDialog(null)}>
          <p className="dialog-description">
            Order #{order.code} · {statusLabel(order.status)}
          </p>
          <DeliveryTimeline status={order.status} />
          <ol className="delivery-updates">
            {updates.map((u) => (
              <li key={u.id}>
                <span />
                <div>
                  <strong>{statusLabel(u.status)}</strong>
                  <p>{dateLabel(u.date)}{u.note ? ` · ${u.note}` : ""}</p>
                </div>
              </li>
            ))}
          </ol>
          {!updates.length && <p className="account-note">No delivery updates yet.</p>}
          <button
            className="account-button full-width"
            onClick={() => setDialog(null)}
          >
            Back to order
          </button>
        </Modal>
      )}
      {(dialog === "cancel" || dialog === "return") && (
        <Modal
          title={
            dialog === "cancel" ? "Cancel this order?" : "Request a return"
          }
          onClose={() => setDialog(null)}
        >
          <p className="dialog-description">
            {dialog === "cancel"
              ? "Confirm to cancel this order and stop its delivery."
              : "Choose an item and tell us what happened. Nestt will review your return request."}
          </p>
          <form className="account-form" onSubmit={submit}>
            {dialog === "return" && (
              <label className="account-field">
                Item
                <select
                  required
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                >
                  {returnable.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="account-field">
              {dialog === "cancel"
                ? "Reason for cancellation"
                : "Reason for return"}
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                {(dialog === "cancel"
                  ? [
                      "Changed my mind",
                      "Ordered by mistake",
                      "Delivery timing",
                      "Other",
                    ]
                  : [
                      "Damaged item",
                      "Wrong item received",
                      "Item not as described",
                      "Other",
                    ]
                ).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            {dialog === "return" && (
              <label className="account-field">
                Additional details (optional)
                <textarea
                  maxLength={440}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tell us a little more…"
                />
              </label>
            )}
            <div className="dialog-actions">
              <button
                className="account-button"
                type="button"
                onClick={() => setDialog(null)}
              >
                {dialog === "cancel" ? "Keep order" : "Go back"}
              </button>
              <button className="account-button primary" type="submit" disabled={busy}>
                {dialog === "cancel"
                  ? "Confirm cancellation"
                  : "Send return request"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
