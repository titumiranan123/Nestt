import type { CatalogRecord } from "@/lib/catalog-demo-data";

const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

const label = "mb-1.5 block text-xs font-semibold text-gray-700";

export function BasicFields({ singular, form, onChange }: { singular: string; form: CatalogRecord; onChange: (key: keyof CatalogRecord, value: string | boolean | number) => void }) {
  return <section className="space-y-4"><div><h3 className="text-sm font-bold text-gray-900">Basic information</h3><p className="mt-1 text-xs text-gray-500">Name and storefront identifier for this {singular.toLowerCase()}.</p></div>
    <div><label className={label} htmlFor="catalog-name">Name <span className="text-red-500">*</span></label><input id="catalog-name" required minLength={2} className={input} value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder={`Enter ${singular.toLowerCase()} name`}/></div>
    <div><label className={label} htmlFor="catalog-slug">Slug <span className="text-red-500">*</span></label><input id="catalog-slug" required pattern="[a-z0-9-]+" className={input} value={form.slug} onChange={(event) => onChange("slug", event.target.value)} placeholder="auto-generated-from-name"/><p className="mt-1 text-[11px] text-gray-400">Lowercase letters, numbers, and hyphens only.</p></div>
  </section>;
}
