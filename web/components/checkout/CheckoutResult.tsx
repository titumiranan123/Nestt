"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { siteFont } from "@/lib/fonts";
import { CheckoutResultCartButton } from "./CheckoutResultCartButton";
import { CheckoutInvoiceButton } from "./CheckoutInvoiceButton";
import "./CheckoutResult.css";

export type CheckoutOutcome = "success" | "failed" | "cancelled";

type CheckoutSummary = {
  items: readonly { id: string; name: string; variant?: string; quantity: number; lineTotal: number; image?: string }[];
  delivery: number;
  total: number;
};

type Confirmation = { orderNumber: string; orderHref: string; paymentLabel: string; payOnDelivery?: boolean; addressSaveFailed?: boolean };

type CheckoutResultProps = {
  summary: CheckoutSummary;
  preview?: boolean;
  orderPlacementFailed?: boolean;
  invoice?: { orderId: string; orderCode: string };
  orderHref?: string;
  orderActionLabel?: string;
} & (
  | { status: "success"; confirmation: Confirmation }
  | { status: "failed" | "cancelled"; confirmation?: never }
);

const icons = {
  check: <path d="m5.5 12 4.3 4.3 8.7-9" />,
  error: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5m0 4h.01" /></>,
  cancel: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  arrow: <path d="M4.5 12h14m-5-5 5 5-5 5" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  bag: <path d="M5 8h14l1 12H4L5 8Zm4 1V6a3 3 0 1 1 6 0v3" />,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 1 1 4.5 2.6c-1.1.6-1.5 1.1-1.5 2.4m0 3h.01" /></>,
};

function Icon({ name, size }: { name: keyof typeof icons; size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

const copy = {
  success: {
    title: "Order confirmed",
    description: "Thanks for shopping with Nestt. Your order is in, and we’ll email you when it’s ready to ship.",
    icon: "check",
    noticeIcon: "mail",
    noticeTitle: "Order confirmation",
    notice: "Your confirmation email includes a receipt and a link to track your order.",
    primary: "View my order",
  },
  failed: {
    title: "Payment failed",
    description: "The payment provider couldn’t complete your payment. Your items are still in your cart.",
    icon: "error",
    noticeIcon: "error",
    noticeTitle: "Check for a pending charge",
    notice: "If your bank shows a pending charge, check its status before trying again.",
    primary: "Try payment again",
  },
  cancelled: {
    title: "Payment cancelled",
    description: "You left the payment page before finishing checkout. Your items are still in your cart.",
    icon: "cancel",
    noticeIcon: "bag",
    noticeTitle: "Ready when you are",
    notice: "Return to checkout to pay, or choose another payment method such as Cash on Delivery.",
    primary: "Return to checkout",
  },
} as const;

const taka = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 });

function Amount({ value }: { value: number }) {
  return <span className="amount"><span className="currency">৳</span>{taka.format(value)}</span>;
}

function ItemImage({ src, alt = "", hero = false }: { src?: string; alt?: string; hero?: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={hero ? "productImage" : "itemThumbnail"}>
      {src && !failed ? (
        <Image src={src} alt={alt} fill preload={hero} unoptimized={!src.startsWith("/")}
          sizes={hero ? "(max-width: 860px) calc(100vw - 40px), 504px" : "60px"}
          onError={() => setFailed(true)} />
      ) : <Icon name="bag" size={hero ? 36 : 21} />}
    </div>
  );
}

export function CheckoutResult({ status, confirmation, summary, preview, orderPlacementFailed, invoice, orderHref, orderActionLabel }: CheckoutResultProps) {
  const [expanded, setExpanded] = useState(false);
  const itemsId = useId();
  const multipleLines = summary.items.length > 1;
  const singleItem = summary.items.length === 1 ? summary.items[0] : undefined;
  const canExpand = summary.items.length > 5;
  const visibleItems = canExpand && !expanded ? summary.items.slice(0, 4) : summary.items;
  const itemCount = summary.items.reduce((total, item) => total + item.quantity, 0);

  const outcome = orderPlacementFailed ? {
    ...copy.failed,
    title: "Order could not be placed",
    description: "Your items are still in your cart. Review availability and delivery details before trying again.",
    noticeTitle: "Review your checkout",
    notice: "Your total or item availability may have changed.",
    primary: "Return to checkout",
  } : confirmation && !preview ? {
    ...copy.success,
    title: "Order placed",
    description: "Thanks for shopping with Nestt. You can follow its progress in your account.",
    noticeIcon: confirmation.payOnDelivery ? "bag" as const : "check" as const,
    notice: confirmation.payOnDelivery ? "Payment is due when your order arrives." : "Your payment was received.",
  } : copy[status];
  return (
    <div className={`${siteFont.className} checkout-result`} data-outcome={status}>
      <main className="shell main">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href="/">Home</Link><Icon name="chevron" size={12} />
          <Link href="/checkout">Checkout</Link><Icon name="chevron" size={12} />
          <span aria-current="page">{confirmation ? "Confirmation" : "Payment result"}</span>
        </nav>

        <div className="columns">
          <section className="content" aria-labelledby="checkout-result-title">
            <div className="statusIcon"><Icon name={outcome.icon} size={36} /></div>
            <h1 id="checkout-result-title">{outcome.title}</h1>
            <p className="lead">{outcome.description}</p>

            <div className="notice">
              <Icon name={outcome.noticeIcon} size={21} />
              <div>
                <h2>{confirmation ? `Order ${confirmation.orderNumber}` : outcome.noticeTitle}</h2>
                <p>{outcome.notice}</p>
                {confirmation?.addressSaveFailed && <p>Your shipping address was used for this order. Save it for future orders in <Link href="/account/addresses" className="underline">your address book</Link>.</p>}
              </div>
            </div>

            <div className="actions">
              <Link href={confirmation?.orderHref ?? orderHref ?? "/checkout"} className="action primary">
                {orderActionLabel ?? outcome.primary}<Icon name="arrow" size={17} />
              </Link>
              {status === "cancelled" || orderPlacementFailed ? (
                orderHref ? <Link href="/checkout" className="action">Try checkout again</Link> :
                  <CheckoutResultCartButton label="View cart" className="action" />
              ) : (
                <Link href={confirmation ? "/products" : orderHref ? "/checkout" : "/checkout#payment-method"} className="action">
                  {confirmation ? "Continue shopping" : orderHref ? "Try checkout again" : "Change payment method"}
                </Link>
              )}
            </div>

            <div className="support">
              <Icon name="help" size={17} />
              <span>Need help?</span>
              <a href="mailto:hello@nestt.com">Contact Nestt support</a>
            </div>
          </section>

          <aside className="summary" aria-labelledby="checkout-summary-title">
            {singleItem?.image && (
              <ItemImage key={singleItem.image} src={singleItem.image} alt={singleItem.name} hero />
            )}
            <div className="receipt">
              <div className="summaryHeader">
                <h2 id="checkout-summary-title">{confirmation || invoice ? "Order summary" : "Cart summary"}</h2>
                {multipleLines && <span>{itemCount} items</span>}
              </div>
              <ul id={itemsId} className={multipleLines ? "items itemsWithPhotos" : "items"}>
                {visibleItems.map((item) => (
                  <li key={item.id}>
                    {multipleLines && <ItemImage key={item.image} src={item.image} />}
                    <div className="itemDetails">
                      <strong>{item.name}</strong>
                      <p>{item.variant && `${item.variant} · `}Qty {item.quantity}</p>
                    </div>
                    <Amount value={item.lineTotal} />
                  </li>
                ))}
              </ul>
              {canExpand && (
                <button type="button" className="summaryItemsToggle" aria-expanded={expanded} aria-controls={itemsId}
                  onClick={() => setExpanded((value) => !value)}>
                  {expanded ? "Show fewer items" : "Show all items"}
                </button>
              )}
              <dl>
                <div className="shipping">
                  <dt>Delivery</dt><dd><Amount value={summary.delivery} /></dd>
                </div>
                <div className="total">
                  <dt>{confirmation?.payOnDelivery ? "Due on delivery" : confirmation ? "Total paid" : "Order total"}</dt>
                  <dd><Amount value={summary.total} /></dd>
                </div>
              </dl>
              <p className="payment">{confirmation?.paymentLabel ?? outcome.title}</p>
              {invoice && <div className="invoiceDownload">
                <CheckoutInvoiceButton {...invoice} className="action" />
              </div>}
              {orderPlacementFailed && <div className="invoiceDownload">
                <button type="button" className="action" aria-describedby="invoice-unavailable" disabled>Download invoice</button>
                <p id="invoice-unavailable" className="invoiceNote">An invoice is available once an order is created.</p>
              </div>}
            </div>
          </aside>
        </div>
      </main>

      <footer className="shell footer">
        <span>© Nestt Furniture</span>
        {preview && <span>Design preview · Sample order</span>}
      </footer>
    </div>
  );
}
