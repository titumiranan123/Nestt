import type { ChangeEvent, ReactNode } from "react";

export const fieldClass = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";
export const areaClass = "min-h-28 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>{children}{hint && <span className="mt-1 block text-[11px] leading-4 text-gray-400">{hint}</span>}</label>;
}

export function TextField({ label, value, onChange, placeholder, type = "text", min, step, required, hint }: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; type?: string; min?: string; step?: string; required?: boolean; hint?: string }) {
  return <Field label={label} hint={hint}><input className={fieldClass} type={type} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} placeholder={placeholder} min={min} step={step} required={required} /></Field>;
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 4, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number; hint?: string }) {
  return <Field label={label} hint={hint}><textarea className={areaClass} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} /></Field>;
}

export function SelectField({ label, value, onChange, options, disabled, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean; placeholder?: string }) {
  return <Field label={label}><select className={fieldClass} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder ?? "Select an option"}</option>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>;
}

export function ToggleField({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (value: boolean) => void; description?: string }) {
  return <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-100 px-3.5 py-3"><span><span className="block text-sm font-medium text-gray-800">{label}</span>{description && <span className="mt-0.5 block text-xs leading-5 text-gray-500">{description}</span>}</span><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-brand" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}
