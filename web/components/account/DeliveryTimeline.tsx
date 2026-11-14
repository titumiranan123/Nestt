import { Icon } from "./ui";
import type { OrderStatus } from "@/lib/account/types";

export function DeliveryTimeline({ status }: { status: OrderStatus }) {
  const index =
    status === "DELIVERED"
      ? 3
      : status === "SHIPPED"
        ? 2
        : status === "PENDING"
          ? 0
          : 1;
  return (
    <ol className="delivery-timeline" aria-label="Order progress">
      {["Ordered", "Confirmed", "Shipped", "Delivered"].map((label, i) => (
        <li
          className={i <= index ? "complete" : ""}
          key={label}
          aria-current={i === index ? "step" : undefined}
        >
          <span className="timeline-dot">
            {i < index || status === "DELIVERED" ? (
              <Icon name="check" size={12} />
            ) : null}
          </span>
          <span>{label}</span>
          {i < index && <span className="sr-only"> completed</span>}
        </li>
      ))}
    </ol>
  );
}
