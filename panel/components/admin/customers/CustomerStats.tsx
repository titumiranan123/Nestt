import { Ban, MailCheck, UserRoundCheck, Users } from "lucide-react";
import type { DemoCustomer } from "@/lib/admin-operations-demo";

export function CustomerStats({ customers }: { customers: DemoCustomer[] }) {
  const stats = [
    { title: "Total Customers", value: customers.length, icon: Users },
    { title: "Active Profiles", value: customers.filter((item) => item.status === "ACTIVE").length, icon: UserRoundCheck },
    { title: "Verified Emails", value: customers.filter((item) => item.isEmailVerified).length, icon: MailCheck },
    { title: "Restricted Profiles", value: customers.filter((item) => item.status !== "ACTIVE").length, icon: Ban },
  ];
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ title, value, icon: Icon }) => <article key={title} className="rounded-2xl border border-line bg-white p-4 shadow-sm xs:p-5"><div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon size={18}/></div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p><p className="mt-2 text-2xl font-bold text-gray-950">{Number(value).toLocaleString()}</p></article>)}</section>;
}
