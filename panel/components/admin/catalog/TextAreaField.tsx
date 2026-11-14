const label = "mb-1.5 block text-xs font-semibold text-gray-700";

export function TextAreaField({ id, title, value, onChange, placeholder, rows, hint }: { id: string; title: string; value: string; onChange: (value: string) => void; placeholder: string; rows: number; hint?: string }) {
  return <div><label className={label} htmlFor={id}>{title}</label><textarea id={id} rows={rows} className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/>{hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}</div>;
}
