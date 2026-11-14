"use client";

import Image from "next/image";
import Link from "next/link";
import { useAccount } from "./AccountProvider";
import { Badge, Icon, PageHeading } from "./ui";
import { DeliveryTimeline } from "./DeliveryTimeline";
import {
  dateLabel,
  money,
  orderTotal,
  products,
  statusLabel,
} from "@/lib/account/data";

export function OverviewPage() {
  const { state } = useAccount();
  const activeOrders = state.orders.filter(
    (o) => !["DELIVERED", "CANCELLED"].includes(o.status),
  );
  const next =
    activeOrders.find((o) => o.status === "SHIPPED") ?? activeOrders[0];
  const address = state.addresses.find((a) => a.isDefaultShipping);
  return (
    <>
      <PageHeading
        title={`Welcome home, ${state.profile.name.split(" ")[0]}.`}
        description="Your orders, favourites and account, all in one place."
        action={
          <Link className="account-button" href="/#recommended">
            Continue shopping <Icon name="arrow" size={15} />
          </Link>
        }
      />
      <div className="overview-stats">
        {[
          {
            title: "Total orders",
            value: state.orders.length,
            icon: "box",
            href: "/account/orders",
          },
          {
            title: "In progress",
            value: activeOrders.length,
            icon: "truck",
            href: "/account/orders?status=progress",
          },
          {
            title: "Wishlist",
            value: state.wishlist.length,
            icon: "heart",
            href: "/account/wishlist",
          },
          {
            title: "Saved addresses",
            value: state.addresses.length,
            icon: "pin",
            href: "/account/addresses",
          },
        ].map((card) => (
          <Link className="stat-card" href={card.href} key={card.title}>
            <Icon name={card.icon} />
            <div>
              <p>{card.title}</p>
              <strong>{String(card.value).padStart(2, "0")}</strong>
            </div>
            <span className="stat-arrow">
              <Icon name="arrow" size={14} />
            </span>
          </Link>
        ))}
      </div>
      <div className="overview-panels">
        <section className="account-card next-delivery">
          {next ? (
            <>
              <p className="account-eyebrow">YOUR NEXT DELIVERY</p>
              <div className="delivery-order-heading">
                <h2>Order #{next.id}</h2>
                <Badge tone={next.status.toLowerCase()}>
                  {statusLabel(next.status)}
                </Badge>
              </div>
              <div className="delivery-product">
                <Image
                  src={next.items[0].image}
                  alt={next.items[0].name}
                  width={235}
                  height={160}
                  priority
                />
                <div>
                  <h3>{next.items[0].name}</h3>
                  <p>
                    {next.items[0].variant} <span> / </span> Qty{" "}
                    {next.items[0].quantity}
                  </p>
                  <div className="delivery-estimate">
                    <Icon name="calendar" />
                    <div>
                      <span>Estimated delivery</span>
                      <strong>
                        {next.delivery ?? "We’ll confirm your delivery shortly"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="delivery-bottom">
                <DeliveryTimeline status={next.status} />
                <Link
                  className="account-button primary"
                  href={`/account/orders/${next.id}`}
                >
                  Track order <Icon name="arrow" size={15} />
                </Link>
              </div>
            </>
          ) : (
            <div className="overview-no-delivery">
              <Icon name="home" size={36} />
              <h2 className="account-section-title">All settled in.</h2>
              <p>
                No deliveries on the way. Find the next piece for your space.
              </p>
              <Link className="account-button primary" href="/#recommended">
                Explore furniture
              </Link>
            </div>
          )}
        </section>
        <section className="account-card overview-account">
          <h2 className="account-section-title">Your account</h2>
          <div className="account-check-row">
            <span
              className={
                state.profile.isEmailVerified ? "verified-dot" : "neutral-dot"
              }
            >
              <Icon
                name={state.profile.isEmailVerified ? "check" : "lock"}
                size={13}
              />
            </span>
            <div>
              <strong>
                {state.profile.isEmailVerified
                  ? "Email verified"
                  : "Email not verified"}
              </strong>
              <p>{state.profile.email}</p>
            </div>
          </div>
          <div className="account-check-row">
            <Icon name="pin" />
            <div>
              <strong>Default delivery</strong>
              <p>
                {address
                  ? `${address.label} · ${address.area}, ${address.city}`
                  : "No saved delivery address"}
              </p>
            </div>
          </div>
          <Link href="/account/addresses">
            Manage addresses <Icon name="arrow" size={17} />
          </Link>
          <Link href="/account/profile">
            Edit profile <Icon name="arrow" size={17} />
          </Link>
        </section>
      </div>
      <div className="account-section-heading">
        <h2 className="account-section-title">Recent orders</h2>
        <Link className="text-link" href="/account/orders">
          View all orders <Icon name="arrow" size={15} />
        </Link>
      </div>
      <div className="account-table-scroll">
        <table className="account-table">
          <thead>
            <tr>
              <th>Order no.</th>
              <th>Order date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>
                <span className="sr-only">View order</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {state.orders.slice(0, 3).map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{dateLabel(order.date)}</td>
                <td>{order.items[0].name}</td>
                <td>{money(orderTotal(order))}</td>
                <td>
                  <Badge tone={order.status.toLowerCase()}>
                    {statusLabel(order.status)}
                  </Badge>
                </td>
                <td>
                  <Link
                    className="text-link"
                    href={`/account/orders/${order.id}`}
                    aria-label={`View order ${order.id}`}
                  >
                    View order <Icon name="arrow" size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="account-section-heading">
        <h2 className="account-section-title">Saved for your space</h2>
        <Link className="text-link" href="/account/wishlist">
          View wishlist <Icon name="arrow" size={15} />
        </Link>
      </div>
      <div className="overview-favourites">
        {state.wishlist.slice(0, 3).map((id) => {
          const p = products.find((p) => p.id === id);
          return (
            p && (
              <Link href="/account/wishlist" key={id}>
                <Image src={p.image} alt={p.name} width={320} height={200} />
                <h3>{p.name}</h3>
                <p>{money(p.price)}</p>
              </Link>
            )
          );
        })}
        {!state.wishlist.length && (
          <p className="account-note">
            Your favourites will appear here.{" "}
            <Link className="text-link" href="/account/wishlist">
              Explore your wishlist
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
