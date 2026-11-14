import { AlertTriangle, CheckCircle2, Database, LoaderCircle } from "lucide-react";
import type { DemoBackup } from "@/lib/admin-operations-demo";

export function BackupStats({ backups }: { backups: DemoBackup[] }) {
  const stats = [{ title: "Total backups", value: backups.length, icon: Database }, { title: "Successful runs", value: backups.filter((item) => item.status === "SUCCESS").length, icon: CheckCircle2 }, { title: "Running now", value: backups.filter((item) => item.status === "RUNNING").length, icon: LoaderCircle }, { title: "Failed runs", value: backups.filter((item) => item.status === "FAILED").length, icon: AlertTriangle }];
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ title, value, icon: Icon }) => <article key={title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p><span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={17}/></span></div><p className="mt-2 text-2xl font-bold text-gray-950">{value}</p></article>)}</section>;
}
