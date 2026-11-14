import type { CatalogRecord } from "@/lib/catalog-demo-data";

import { TextAreaField } from "./TextAreaField";

import { UrlField } from "./UrlField";

export function BrandFields({ form, onChange }: { form: CatalogRecord; onChange: (key: keyof CatalogRecord, value: string | boolean | number) => void }) {
  return <section className="space-y-4 border-t border-gray-100 pt-5"><div><h3 className="text-sm font-bold text-gray-900">Brand profile</h3><p className="mt-1 text-xs text-gray-500">Tell customers about this brand and its storefront identity.</p></div><TextAreaField id="brand-description" title="Description" value={form.description ?? ""} onChange={(value) => onChange("description", value)} placeholder="Tell customers about this brand..." rows={3}/><UrlField id="brand-logo" title="Logo image URL" value={form.logo ?? ""} onChange={(value) => onChange("logo", value)} placeholder="https://example.com/brand-logo.png"/></section>;
}
