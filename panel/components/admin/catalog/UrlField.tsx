const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

const label = "mb-1.5 block text-xs font-semibold text-gray-700";

export function UrlField({ id, title, value, onChange, placeholder }: { id: string; title: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div><label className={label} htmlFor={id}>{title}</label><input id={id} type="url" className={input} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/><p className="mt-1 text-[11px] text-gray-400">Temporary demo field; image upload is not connected.</p></div>;
}
