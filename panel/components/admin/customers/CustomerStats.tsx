import { Ban, MailCheck, UserRoundCheck, Users } from "lucide-react";
import type { CustomerSummary } from "@/features/customers/types";

export function CustomerStats({ summary }: { summary?: CustomerSummary }) {
  const stats = [
    { title: "Total Customers", value: summary?.total, icon: Users },
    { title: "Active Profiles", value: summary?.active, icon: UserRoundCheck },
    { title: "Verified Emails", value: summary?.verified, icon: MailCheck },
    { title: "Restricted Profiles", value: summary?.restricted, icon: Ban },
  ];
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ title, value, icon: Icon }) => <article key={title} className="rounded-2xl border border-line bg-white p-4 shadow-sm xs:p-5"><div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon size={18}/></div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p><p className="mt-2 text-2xl font-bold text-gray-950">{value?.toLocaleString() ?? "—"}</p></article>)}</section>;
}
