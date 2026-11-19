export type DemoNotification = {
  id: string;
  type: "ORDER" | "PAYMENT" | "STOCK" | "REVIEW" | "CUSTOMER";
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  target?: string;
};

export const demoNotifications: DemoNotification[] = [
  { id: "NT-01", type: "ORDER", title: "New order received", body: "Order ORD-2026-1084 was placed by Maliha Rahman for ৳34,800.", createdAt: "2026-10-28T10:42:00", isRead: false, target: "/admin/orders" },
  { id: "NT-02", type: "PAYMENT", title: "Payment confirmed", body: "Payment for order ORD-2026-1083 was received successfully.", createdAt: "2026-10-28T09:18:00", isRead: false, target: "/admin/orders" },
  { id: "NT-03", type: "STOCK", title: "Low stock alert", body: "Forma lounge chair is down to 7 units in available inventory.", createdAt: "2026-10-27T16:25:00", isRead: false },
  { id: "NT-04", type: "REVIEW", title: "Review awaiting moderation", body: "A new customer review for Haven 3-seat sofa is ready for review.", createdAt: "2026-10-27T13:10:00", isRead: true },
  { id: "NT-05", type: "CUSTOMER", title: "New customer registered", body: "Nusrat Jahan created a customer account.", createdAt: "2026-10-26T11:35:00", isRead: true },
  { id: "NT-06", type: "ORDER", title: "Order marked as shipped", body: "Order ORD-2026-1082 was handed to the delivery partner.", createdAt: "2026-10-25T15:40:00", isRead: true, target: "/admin/orders" },
  { id: "NT-07", type: "STOCK", title: "Product out of stock", body: "Morrow dining set is no longer available in stock.", createdAt: "2026-10-24T12:20:00", isRead: false },
  { id: "NT-08", type: "PAYMENT", title: "Refund completed", body: "The refund for order ORD-2026-1078 was completed.", createdAt: "2026-10-23T09:05:00", isRead: true },
];

