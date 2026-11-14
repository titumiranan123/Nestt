import type { CatalogRecord } from "@/lib/catalog-demo-data";

import { ToggleField } from "./ToggleField";

type CatalogKind = "products" | "categories" | "attributes" | "brands";

export function VisibilityFields({ kind, form, onChange }: { kind: CatalogKind; form: CatalogRecord; onChange: (key: keyof CatalogRecord, value: string | boolean | number) => void }) {
  return <section className="space-y-3 border-t border-gray-100 pt-5"><div><h3 className="text-sm font-bold text-gray-900">Visibility & status</h3><p className="mt-1 text-xs text-gray-500">Choose how this item is shown across the storefront.</p></div>
    {kind === "brands" && <ToggleField title="Verified brand" description="Display the verified badge on this brand." checked={Boolean(form.verified)} onChange={(value) => onChange("verified", value)}/>}
    {kind === "categories" && <ToggleField title="Popular category" description="Feature this category in popular collections." checked={Boolean(form.isPopular)} onChange={(value) => onChange("isPopular", value)}/>}
    <ToggleField title="Published" description="Make this item available on the storefront." checked={Boolean(form.isPublished)} onChange={(value) => onChange("isPublished", value)}/>
  </section>;
}
