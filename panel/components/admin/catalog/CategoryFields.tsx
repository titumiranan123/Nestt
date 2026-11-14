import type { CatalogRecord } from "@/lib/catalog-demo-data";

import { TextAreaField } from "./TextAreaField";

import { UrlField } from "./UrlField";

import { SeoFields } from "./SeoFields";

const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

const label = "mb-1.5 block text-xs font-semibold text-gray-700";

export function CategoryFields({ form, rows, onChange }: { form: CatalogRecord; rows: CatalogRecord[]; onChange: (key: keyof CatalogRecord, value: string | boolean | number) => void }) {
  return <section className="space-y-4 border-t border-gray-100 pt-5"><div><h3 className="text-sm font-bold text-gray-900">Category setup</h3><p className="mt-1 text-xs text-gray-500">Control hierarchy, catalog cards, and search metadata.</p></div>
    <div><label className={label} htmlFor="category-parent">Parent category</label><select id="category-parent" className={input} value={form.parent ?? ""} onChange={(event) => onChange("parent", event.target.value)}><option value="">No parent (top level)</option>{rows.filter((row) => row.id !== form.id).map((row) => <option key={row.id}>{row.name}</option>)}</select></div>
    <div><label className={label} htmlFor="category-card-mode">Product card display</label><select id="category-card-mode" className={input} value={form.productCardMode ?? "One product"} onChange={(event) => onChange("productCardMode", event.target.value)}><option>One product</option><option>One variant</option></select></div>
    <div><label className={label} htmlFor="category-sort">Sort order</label><input id="category-sort" type="number" min="0" className={input} value={form.sortOrder ?? 0} onChange={(event) => onChange("sortOrder", Number(event.target.value))}/></div>
    <TextAreaField id="category-description" title="Description" value={form.description ?? ""} onChange={(value) => onChange("description", value)} placeholder="Describe this category..." rows={3}/>
    <UrlField id="category-logo" title="Category image URL" value={form.logo ?? ""} onChange={(value) => onChange("logo", value)} placeholder="https://example.com/category-image.png"/>
    <SeoFields prefix="category" form={form} onChange={onChange}/>
  </section>;
}
