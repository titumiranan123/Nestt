const card = "rounded-xl border border-gray-200 bg-white shadow-sm";

export function NotificationSummaryCards({ unreadCount, total }: { unreadCount: number; total: number }) {
  const stats = [{ title: "Unread", value: unreadCount, caption: "Notifications that still need attention.", tint: "bg-brand-soft text-brand" }, { title: "Total", value: total, caption: "All notifications in this demo inbox.", tint: "bg-sky-50 text-sky-700" }, { title: "Read", value: total - unreadCount, caption: "Notifications already opened.", tint: "bg-emerald-50 text-emerald-700" }];
  return <section className="grid gap-3 md:grid-cols-3">{stats.map(({ title, value, caption, tint }) => <article key={title} className={`${card} p-4`}><p className="text-[10px] font-bold uppercase tracking-[.16em] text-gray-400">{title}</p><p className="mt-2 text-3xl font-bold text-gray-950">{value}</p><p className="mt-1 text-xs text-gray-500">{caption}</p><span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${tint}`}>Demo</span></article>)}</section>;
}
