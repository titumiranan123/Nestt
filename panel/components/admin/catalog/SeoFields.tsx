import type { CatalogRecord } from "@/lib/catalog-demo-data";

import { TextAreaField } from "./TextAreaField";

const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

const label = "mb-1.5 block text-xs font-semibold text-gray-700";

export function SeoFields({ prefix, form, onChange }: { prefix: string; form: CatalogRecord; onChange: (key: keyof CatalogRecord, value: string | boolean | number) => void }) {
  return <section className="space-y-3 rounded-lg border border-gray-200 p-3"><div><h4 className="text-xs font-bold text-gray-800">SEO information</h4><p className="mt-1 text-[11px] text-gray-500">Optional metadata for search results.</p></div><div><label className={label} htmlFor={`${prefix}-meta-title`}>Meta title</label><input id={`${prefix}-meta-title`} className={input} value={form.metaTitle ?? ""} onChange={(event) => onChange("metaTitle", event.target.value)} placeholder="Page title for search results"/></div><TextAreaField id={`${prefix}-meta-description`} title="Meta description" value={form.metaDescription ?? ""} onChange={(value) => onChange("metaDescription", value)} placeholder="A short search description" rows={2}/><div><label className={label} htmlFor={`${prefix}-meta-keywords`}>Meta keywords</label><input id={`${prefix}-meta-keywords`} className={input} value={form.metaKeywords ?? ""} onChange={(event) => onChange("metaKeywords", event.target.value)} placeholder="furniture, home, design"/></div></section>;
}
