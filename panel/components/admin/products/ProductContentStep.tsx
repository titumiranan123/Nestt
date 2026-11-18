"use client";

import type { ProductCareItemInput, ProductInput, ProductSpecificationInput } from "@/features/products/types";
import { ProductCareEditor } from "./ProductCareEditor";
import { ProductSpecificationEditor } from "./ProductSpecificationEditor";
import { TextAreaField } from "./ProductFormFields";

export function ProductContentStep({ features, note, specification, careItems, onFeatures, onNote, onSpecification, onCareItems }: { features: string[]; note: string; specification?: ProductSpecificationInput | null; careItems?: ProductCareItemInput[]; onFeatures: (value: string[]) => void; onNote: (value: string) => void; onSpecification: (value: ProductSpecificationInput) => void; onCareItems: (value: ProductCareItemInput[]) => void }) {
  return <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
    <div className="border-b border-brand/10 px-5 py-4"><h2 className="font-semibold text-ink">Product content</h2><p className="mt-1 text-xs text-muted">Storefront highlights and customization guidance.</p></div>
    <div className="space-y-5 p-5"><TextAreaField label="Product features" value={features.join("\n")} onChange={(value) => onFeatures(value.split("\n").map((item) => item.trim()).filter(Boolean))} placeholder={"Kiln-dried hardwood frame\nPerformance fabric upholstery\nMade for everyday living"} rows={8} hint="These are shared by variants. Add variant-specific features in the Variants section." />
      <TextAreaField label="Customization note" value={note} onChange={onNote} placeholder="Explain what customers can customize." rows={4} />
      <ProductCareEditor value={careItems} onChange={onCareItems} />
      <ProductSpecificationEditor value={specification} onChange={onSpecification} title="Product specifications (shared default)" hint="These apply to every variant unless a variant overrides the same label." />
    </div>
  </section>;
}

export type ProductContentFields = Pick<ProductInput, "features" | "customizableTextNote">;
