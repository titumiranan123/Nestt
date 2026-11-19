const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function NumberField({ title, value, placeholder, prefix, onChange }: { title: string; value: number | null; placeholder: string; prefix?: string; onChange: (value: number | null) => void }) {
  return <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">{title}</label><div className="relative">{prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{prefix}</span>}<input type="number" min="0" className={`${input} ${prefix ? "pl-8" : ""}`} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}/></div></div>;
}
