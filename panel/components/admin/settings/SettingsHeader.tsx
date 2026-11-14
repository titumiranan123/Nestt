import type { LucideIcon } from "lucide-react";

export default function SettingsHeader({ eyebrow, title, description, icon: Icon, actions }: {
  eyebrow: string; title: string; description: string; icon: LucideIcon; actions?: React.ReactNode;
}) {
  return <header className="flex flex-col gap-4 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={21} /></span>
      <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-brand">{eyebrow}</p><h1 className="mt-1 text-[22px] font-bold leading-tight tracking-[-.035em] text-gray-900 sm:text-2xl">{title}</h1><p className="mt-1 max-w-3xl text-[13px] leading-5 text-gray-500">{description}</p></div>
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>;
}
