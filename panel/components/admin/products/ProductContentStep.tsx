"use client";

import type { ProductInput } from "@/features/products/types";
import { TextAreaField } from "./ProductFormFields";

export function ProductContentStep({ features, note, onFeatures, onNote }: { features: string[]; note: string; onFeatures: (value: string[]) => void; onNote: (value: string) => void }) {
  return <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
    <div className="border-b border-brand/10 px-5 py-4"><h2 className="font-semibold text-ink">Product content</h2><p className="mt-1 text-xs text-muted">Storefront highlights and customization guidance.</p></div>
    <div className="space-y-5 p-5"><TextAreaField label="Product features" value={features.join("\n")} onChange={(value) => onFeatures(value.split("\n").map((item) => item.trim()).filter(Boolean))} placeholder={"Kiln-dried hardwood frame\nPerformance fabric upholstery\nMade for everyday living"} rows={8} hint="Add one feature per line. The product schema stores these as a string list." />
      <TextAreaField label="Customization note" value={note} onChange={onNote} placeholder="Explain what customers can customize." rows={4} />
    </div>
  </section>;
}

export type ProductContentFields = Pick<ProductInput, "features" | "customizableTextNote">;
