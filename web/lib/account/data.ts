import type { CustomerOrder } from "./types";

const currency = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 });
export const money = (amount: number) => `৳${currency.format(amount)}`;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "numeric",
  month: "short",
  year: "numeric",
});
export const dateLabel = (date: string) => dateFormatter.format(new Date(date));
export const orderTotal = (order: CustomerOrder) => order.total;
export const statusLabel = (value: string) => {
  const label = value.replaceAll("_", " ").toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
};
