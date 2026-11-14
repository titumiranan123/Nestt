import { Activity, CircleCheck, CircleX, UserRound } from "lucide-react";
import type { DemoAuditLog } from "@/lib/admin-operations-demo";

export function AuditStats({ logs }: { logs: DemoAuditLog[] }) {
  const stats = [{ title: "Total events", value: logs.length, icon: Activity }, { title: "Unique actors", value: new Set(logs.map((item) => item.actor)).size, icon: UserRound }, { title: "Successful", value: logs.filter((item) => item.status === "SUCCESS").length, icon: CircleCheck }, { title: "Failed events", value: logs.filter((item) => item.status === "FAILED").length, icon: CircleX }];
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ title, value, icon: Icon }) => <article key={title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p><span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={17}/></span></div><p className="mt-2 text-2xl font-bold text-gray-950">{value}</p></article>)}</section>;
}
