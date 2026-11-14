export function SettingsPanel({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"><header className="flex flex-col gap-2 border-b border-line bg-[linear-gradient(180deg,#fff,#fbfcfd)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-bold text-gray-900">{title}</h2>{description ? <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p> : null}</div>{action}</header><div>{children}</div></section>;
}

export function SettingsMetric({ label, value, detail, icon: Icon, tone = "brand" }: { label: string; value: string | number; detail: string; icon: React.ElementType; tone?: "brand" | "green" | "amber" | "blue" }) {
  const colors = { brand: "bg-brand-soft text-brand", green: "bg-green-50 text-green-700", amber: "bg-amber-50 text-amber-700", blue: "bg-sky-50 text-sky-700" };
  return <div className="rounded-2xl border border-line bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{value}</p></div><span className={`grid size-9 place-items-center rounded-xl ${colors[tone]}`}><Icon size={17}/></span></div><p className="mt-2 text-[11px] text-gray-500">{detail}</p></div>;
}

export const settingsInput = "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand/50 focus:ring-4 focus:ring-brand/10";
export const settingsLabel = "mb-1.5 block text-xs font-semibold text-gray-700";
