"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAccount } from "./AccountProvider";
import { Badge, EmptyState, Icon, Modal, PageHeading } from "./ui";
import { DeliveryTimeline } from "./DeliveryTimeline";
import { dateLabel, money, orderTotal, statusLabel } from "@/lib/account/data";
import type { Address } from "@/lib/account/types";

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
  const { state, cancelOrder, returnItem } = useAccount();
  const order = state.orders.find((o) => o.id === id);
  const [dialog, setDialog] = useState<"cancel" | "return" | "tracking" | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [itemId, setItemId] = useState("");
  if (!order)
    return (
      <EmptyState
        title="We couldn’t find that order."
        description="Check the order number or return to your orders."
        action={
          <Link href="/account/orders" className="account-button primary">
            Back to orders
          </Link>
        }
      />
    );
  const cancelled = order.status === "CANCELLED";
  const delivered = order.status === "DELIVERED";
  const canCancel =
    ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status) &&
    order.payment !== "PAID";
  const returnable = order.items.filter(
    (i) => !order.returns.some((r) => r.itemId === i.id),
  );
  const updates = [
    { title: "Order placed", date: dateLabel(order.date), done: true },
    {
      title: "Your order is confirmed",
      date: "Preparing your order",
      done: order.status !== "PENDING" && !cancelled,
    },
    {
      title: "Dispatched from Dhaka warehouse",
      date: "Nestt delivery team",
      done: order.status === "SHIPPED" || delivered,
    },
    {
      title: "Delivered to your home",
      date: order.deliveredAt ? dateLabel(order.deliveredAt) : "",
      done: delivered,
    },
  ]
    .filter((u) => u.done)
    .reverse();
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    if (dialog === "cancel") cancelOrder(id, reason);
    else if (dialog === "return" && itemId)
      returnItem(id, itemId, reason, note);
    setDialog(null);
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
        title={`Order #${order.id}`}
        description={`Placed on ${dateLabel(order.date)}`}
        action={
          <button className="account-button" onClick={() => window.print()}>
            <Icon name="download" size={16} />
            Print invoice
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
        <span>Demo order</span>
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
              ? `Delivered on ${dateLabel(order.deliveredAt ?? order.date)}`
              : `Estimated arrival: ${order.delivery ?? "We’ll confirm your delivery shortly."}`}
        </p>
        {!cancelled && <DeliveryTimeline status={order.status} />}
        {!cancelled && (
          <div className="tracking-provider">
            <span>
              <Icon name="truck" />
              Nestt delivery team{" "}
              {order.status === "SHIPPED" || delivered
                ? `· NST-DHK-${order.id.slice(4)}`
                : "· Awaiting dispatch"}
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
                  src={item.image}
                  alt={item.name}
                  width={220}
                  height={165}
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
            </section>
            <section className="account-card">
              <h2>
                <Icon name="box" size={18} />
                Billing address
              </h2>
              <p className="account-note">Same as shipping address</p>
            </section>
          </div>
        </div>
        <section className="account-card order-summary">
          <h2 className="account-section-title">Order summary</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>
                {money(
                  order.items.reduce((n, i) => n + i.price * i.quantity, 0),
                )}
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
            {order.transaction && <p>Transaction: {order.transaction}</p>}
            {order.payment === "PENDING" && !cancelled && (
              <p>
                Please pay {money(orderTotal(order))} when your order arrives.
              </p>
            )}
            {order.payment === "REFUNDED" && (
              <p>This sample order is marked as refunded.</p>
            )}
          </div>
        </section>
      </div>
      <div className="order-detail-bottom">
        <section className="account-card">
          <h2 className="account-section-title">Delivery updates</h2>
          {cancelled ? (
            <p className="account-note">
              Order cancelled. No further deliveries are scheduled.
            </p>
          ) : (
            <ol className="delivery-updates">
              {updates.map((u, i) => (
                <li key={u.title}>
                  <span className={i === 0 ? "current" : ""} />
                  <div>
                    <strong>{u.title}</strong>
                    <p>{u.date}</p>
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
            href={`mailto:hello@nestt.home?subject=${encodeURIComponent(`Help with order ${order.id}`)}`}
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
                  : "Cancellation is unavailable after dispatch."}
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
              <Badge tone="pending">Requested</Badge>
              <strong>{r.reference}</strong>
              <p>
                {order.items.find((i) => i.id === r.itemId)?.name} · {r.reason}
              </p>
              <p className="account-note">
                Recorded on {dateLabel(r.date)} in this browser. No return
                request has been sent to Nestt.
              </p>
            </div>
          ))}
        </section>
      )}
      {dialog === "tracking" && (
        <Modal title="Your delivery journey" onClose={() => setDialog(null)}>
          <p className="dialog-description">
            Order #{order.id} ·{" "}
            {order.delivery
              ? `Estimated ${order.delivery}`
              : statusLabel(order.status)}
          </p>
          <DeliveryTimeline status={order.status} />
          <ol className="delivery-updates">
            {updates.map((u) => (
              <li key={u.title}>
                <span />
                <div>
                  <strong>{u.title}</strong>
                  <p>{u.date}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="account-note">
            Sample order history. Delivery status updates are added manually
            by our team.
          </p>
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
              ? "This demo cancellation cannot be undone. Your other orders will stay as they are."
              : "Choose the item and tell us what happened. This records a demo request on this device."}
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
                  maxLength={500}
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
              <button className="account-button primary" type="submit">
                {dialog === "cancel"
                  ? "Confirm cancellation"
                  : "Record demo return"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      <section className="print-invoice">
        <h1>NESTT · Demo invoice</h1>
        <p>
          Order #{order.id} · {dateLabel(order.date)}
        </p>
        <AddressDisplay address={order.shipping} />
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>
                  {i.name} — {i.variant}
                </td>
                <td>{i.quantity}</td>
                <td>{money(i.quantity * i.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Delivery: {money(order.shippingCharge)} · Discount:{" "}
          {money(order.discount)}
        </p>
        <strong>Total: {money(orderTotal(order))}</strong>
        <p>
          Payment: {order.method} · {statusLabel(order.payment)}
        </p>
        <p>
          Sample document only. This is not proof of purchase or a tax invoice.
        </p>
      </section>
    </>
  );
}
