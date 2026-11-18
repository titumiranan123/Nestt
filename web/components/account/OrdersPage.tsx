"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAccount } from "./AccountProvider";
import { Badge, EmptyState, Icon, PageHeading, handleTabKeys } from "./ui";
import {
  dateLabel,
  money,
  orderTotal,
  statusLabel,
} from "@/lib/account/data";

export function OrdersPage() {
  const { state, buyAgain, busy } = useAccount();
  const params = useSearchParams();
  const [tab, setTab] = useState(
    params.get("status") === "progress" ? "progress" : "all",
  );
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("all");
  const [page, setPage] = useState(1);
  const matchesTab = (status: string, value: string) =>
    value === "all" ||
    (value === "progress"
      ? !["DELIVERED", "CANCELLED"].includes(status)
      : status === value);
  const filtered = state.orders.filter(
    (o) =>
      matchesTab(o.status, tab) &&
      `${o.code} ${o.items.map((i) => i.name).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (range === "all" ||
        Date.parse(o.date) >=
          Date.now() - Number(range) * 86400000),
  );
  const pages = Math.ceil(filtered.length / 4);
  const currentPage = Math.min(page, pages || 1);
  const shown = filtered.slice((currentPage - 1) * 4, currentPage * 4);
  function clear() {
    setTab("all");
    setQuery("");
    setRange("all");
    setPage(1);
  }
  return (
    <>
      <PageHeading
        title="My orders"
        description="Every piece, from checkout to your doorstep."
        action={
          <Link className="account-button" href="/#recommended">
            Continue shopping <Icon name="arrow" size={15} />
          </Link>
        }
      />
      <div
        className="account-tabs"
        role="tablist"
        aria-label="Filter orders by status"
        onKeyDown={handleTabKeys}
      >
        {[
          { id: "all", title: "All orders" },
          { id: "progress", title: "In progress" },
          { id: "DELIVERED", title: "Delivered" },
          { id: "CANCELLED", title: "Cancelled" },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`order-tab-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            aria-selected={tab === t.id}
            aria-controls="order-results"
            className={tab === t.id ? "active" : ""}
            onClick={() => {
              setTab(t.id);
              setPage(1);
            }}
          >
            {t.title}{" "}
            <span>
              ({state.orders.filter((o) => matchesTab(o.status, t.id)).length})
            </span>
          </button>
        ))}
      </div>
      <div className="orders-toolbar">
        <label className="order-search">
          <Icon name="search" size={18} />
          <span className="sr-only">
            Search orders by order number or product
          </span>
          <input
            type="search"
            value={query}
            placeholder="Search by order number or product"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Order date range</span>
          <select
            className="account-input"
            value={range}
            onChange={(e) => {
              setRange(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </label>
      </div>
      <section
        id="order-results"
        role="tabpanel"
        aria-labelledby={`order-tab-${tab}`}
      >
        <p className="sr-only" role="status">
          {filtered.length} orders found
        </p>
        {shown.length ? (
          <div className="order-list">
            {shown.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <strong>Order #{order.code}</strong>
                  <span>Placed on {dateLabel(order.date)}</span>
                  <Badge tone={order.status.toLowerCase()}>
                    {statusLabel(order.status)}
                  </Badge>
                  <span className="payment-label">
                    Payment: <b>{statusLabel(order.payment)}</b>
                  </span>
                </div>
                <div className="order-card-body">
                  <Image
                    src={order.items[0]?.image ?? "/assets/hero/quality-living-room.webp"}
                    alt={order.items[0]?.name ?? ""}
                    width={200}
                    height={130}
                    unoptimized
                  />
                  <div className="order-card-product">
                    <h2>{order.items[0]?.name ?? "Order items"}</h2>
                    {order.items[0] && <p>
                      {order.items[0].variant && `${order.items[0].variant} / `}Qty {order.items[0].quantity}
                      {order.items.length > 1 &&
                        ` +${order.items.length - 1} more items`}
                    </p>}
                    {order.deliveredAt && (
                      <div className="order-arrival">
                        <Icon name="check" size={17} />
                        <div>
                          Delivered on
                          <strong>{dateLabel(order.deliveredAt)}</strong>
                        </div>
                      </div>
                    )}
                    {order.status === "CANCELLED" && (
                      <p className="account-note">
                        {order.cancelReason ?? "Order cancelled"}
                      </p>
                    )}
                  </div>
                  <div className="order-total">
                    <span>Total</span>
                    <strong>{money(orderTotal(order))}</strong>
                  </div>
                  <div className="order-card-actions">
                    {order.status === "SHIPPED" && (
                      <Link
                        className="account-button primary"
                        href={`/account/orders/${order.id}`}
                      >
                        Track order
                      </Link>
                    )}
                    <Link
                      className="account-button"
                      href={`/account/orders/${order.id}`}
                    >
                      View details
                    </Link>
                    {order.status === "DELIVERED" && order.items.length > 0 && (
                      <button
                        className="account-button primary"
                        disabled={busy}
                        onClick={() => void buyAgain(order)}
                      >
                        Buy again
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              state.orders.length
                ? "No orders found."
                : "Your home story starts here."
            }
            description={
              state.orders.length
                ? "Try a different search or clear your filters."
                : "Your orders will appear here once you find the right piece."
            }
            action={
              state.orders.length ? (
                <button className="account-button" onClick={clear}>
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}
      </section>
      {filtered.length > 0 && (
        <nav className="account-pagination" aria-label="Order pagination">
          <p>
            Showing {(currentPage - 1) * 4 + 1}–
            {Math.min(currentPage * 4, filtered.length)} of {filtered.length}{" "}
            orders
          </p>
          <div>
            <button
              className="account-button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Previous page"
            >
              ←
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`account-button ${currentPage === p ? "primary" : ""}`}
                aria-current={currentPage === p ? "page" : undefined}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="account-button"
              disabled={currentPage === pages}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Next page"
            >
              Next <Icon name="arrow" size={14} />
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
