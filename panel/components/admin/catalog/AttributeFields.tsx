import type { CatalogRecord } from "@/lib/catalog-demo-data";

import { TextAreaField } from "./TextAreaField";

import { ToggleField } from "./ToggleField";

const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

const label = "mb-1.5 block text-xs font-semibold text-gray-700";

export function AttributeFields({ form, optionText, onOptionText, onChange }: { form: CatalogRecord; optionText: string; onOptionText: (value: string) => void; onChange: (key: keyof CatalogRecord, value: string | boolean | number) => void }) {
  return <section className="space-y-4 border-t border-gray-100 pt-5"><div><h3 className="text-sm font-bold text-gray-900">Attribute options</h3><p className="mt-1 text-xs text-gray-500">Set variant options and storefront behavior.</p></div>
    <div><label className={label} htmlFor="attribute-type">Attribute type</label><select id="attribute-type" className={input} value={form.type ?? "Dropdown"} onChange={(event) => onChange("type", event.target.value)}><option>Dropdown</option><option>Box</option><option>Color</option></select></div>
    <TextAreaField id="attribute-options" title="Options" value={optionText} onChange={onOptionText} placeholder="Natural oak, Sage, Charcoal" rows={4} hint="Separate each option with a comma."/>
    <ToggleField title="Show in filters" description="Let shoppers filter products by this attribute." checked={Boolean(form.showInFilter)} onChange={(value) => onChange("showInFilter", value)}/>
    <ToggleField title="Show on product card" description="Display selected attribute values on product listings." checked={Boolean(form.showOnProductCard)} onChange={(value) => onChange("showOnProductCard", value)}/>
    {form.showOnProductCard && <div className="grid gap-3 sm:grid-cols-2"><div><label className={label} htmlFor="attribute-card-display">Card display</label><select id="attribute-card-display" className={input} value={form.cardDisplayType ?? "Chip"} onChange={(event) => onChange("cardDisplayType", event.target.value)}><option>Chip</option><option>Swatch</option><option>Text</option></select></div><div><label className={label} htmlFor="attribute-card-max">Maximum options</label><input id="attribute-card-max" type="number" min="1" className={input} value={form.cardMaxOptions ?? 4} onChange={(event) => onChange("cardMaxOptions", Number(event.target.value))}/></div></div>}
    <div><label className={label} htmlFor="attribute-unit">Unit</label><input id="attribute-unit" className={input} value={form.unit ?? ""} onChange={(event) => onChange("unit", event.target.value)} placeholder="cm, kg, inch..."/></div>
    <ToggleField title="Comparable" description="Include this attribute in product comparison." checked={Boolean(form.isComparable)} onChange={(value) => onChange("isComparable", value)}/>
    <div><label className={label} htmlFor="attribute-sort">Sort order</label><input id="attribute-sort" type="number" min="0" className={input} value={form.sortOrder ?? 0} onChange={(event) => onChange("sortOrder", Number(event.target.value))}/></div>
  </section>;
}
