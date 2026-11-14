const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function NumberField({ title, value, placeholder, onChange }: { title: string; value: number | null; placeholder: string; onChange: (value: number | null) => void }) {
  return <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">{title}</label><input type="number" min="0" className={input} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}/></div>;
}
