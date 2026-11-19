import type { DashboardPeriod } from "./types";

const timeZone = "Asia/Dhaka";
const money = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 });
const compactMoney = new Intl.NumberFormat("en-BD", { notation: "compact", maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("en-BD", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
const shortDate = new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeZone });
const daily = new Intl.DateTimeFormat("en-BD", { month: "short", day: "numeric", timeZone });
const hourly = new Intl.DateTimeFormat("en-BD", { hour: "numeric", hour12: true, timeZone });
const monthly = new Intl.DateTimeFormat("en-BD", { month: "short", timeZone });

export function formatDashboardMoney(value: string | number, compact = false) {
  return `৳${(compact ? compactMoney : money).format(Number(value))}`;
}

export function formatDashboardDate(value: string) {
  return shortDate.format(new Date(value));
}

export function formatRevenueBucket(value: string, period: DashboardPeriod) {
  const formatter = period === "today" ? hourly : period === "year" ? monthly : daily;
  return formatter.format(new Date(value));
}

export function formatPeriodChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? percent.format(0) : null;
  return percent.format((current - previous) / previous);
}
