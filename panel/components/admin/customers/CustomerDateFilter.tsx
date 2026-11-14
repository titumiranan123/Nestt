import { CalendarDays } from "lucide-react";

export function CustomerDateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="relative flex h-10 min-w-[145px] items-center rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"><span className="truncate">{value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US") : label}</span><CalendarDays size={15} className="ml-auto shrink-0 text-brand"/><input aria-label={label} type="date" value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/></label>;
}
