"use client";

import type { ProductCategory, ProductInput, ProductStatus } from "@/features/products/types";
import { Field, SelectField, TextAreaField, TextField, ToggleField } from "./ProductFormFields";

type Details = Pick<ProductInput, "name" | "slug" | "tags" | "categoryId" | "brandId" | "description" | "useEnvironment" | "status" | "sortOrder" | "isFeatured" | "isNewArrival" | "isBestSeller" | "isContractGrade" | "isCustomizable" | "isPriceOnRequest">;

export function ProductDetailsStep({ value, categories, set }: { value: Details; categories: ProductCategory[]; set: <K extends keyof Details>(key: K, next: Details[K]) => void }) {
  return <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
    <div className="border-b border-brand/10 px-5 py-4"><h2 className="font-semibold text-ink">Product details</h2><p className="mt-1 text-xs text-muted">The essential information used by the Nestt storefront and catalog.</p></div>
    <div className="grid gap-4 p-5 md:grid-cols-2">
      <TextField label="Product name" value={value.name} onChange={(next) => set("name", next)} placeholder="e.g. Haven three-seat sofa" required />
      <TextField label="Slug" value={value.slug ?? ""} onChange={(next) => set("slug", next)} placeholder="Auto-generated from product name" hint="Lowercase letters, numbers and hyphens." />
      <SelectField label="Category" value={value.categoryId} onChange={(next) => set("categoryId", next)} options={categories.map((category) => ({ value: category.id, label: category.name }))} placeholder={categories.length ? "Select category" : "No categories available"} disabled={!categories.length} />
      <Field label="Brand ID (optional)" hint="Nestt does not currently expose a brand picker API; the schema accepts a brand UUID."><input className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10" value={value.brandId ?? ""} onChange={(event) => set("brandId", event.target.value || null)} placeholder="Brand UUID" /></Field>
      <SelectField label="Environment" value={value.useEnvironment ?? "indoor"} onChange={(next) => set("useEnvironment", next as "indoor" | "outdoor")} options={[{ value: "indoor", label: "Indoor" }, { value: "outdoor", label: "Outdoor" }]} />
      <SelectField label="Status" value={value.status ?? "draft"} onChange={(next) => set("status", next as ProductStatus)} options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "archived", label: "Archived" }]} />
      <TextField label="Sort order" type="number" min="0" step="1" value={value.sortOrder ?? 0} onChange={(next) => set("sortOrder", Math.max(0, Number(next) || 0))} hint="Smaller numbers appear first." />
      <TextField label="Tags" value={(value.tags ?? []).join(", ")} onChange={(next) => set("tags", next.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="sofa, living room, bestseller" hint="Separate tags with commas." />
      <div className="md:col-span-2"><TextAreaField label="Description" value={value.description ?? ""} onChange={(next) => set("description", next || null)} placeholder="Describe this product for customers." rows={5} /></div>
      <div className="grid gap-2 sm:grid-cols-2 md:col-span-2 xl:grid-cols-3">
        <ToggleField label="Featured" checked={value.isFeatured ?? false} onChange={(next) => set("isFeatured", next)} />
        <ToggleField label="New arrival" checked={value.isNewArrival ?? false} onChange={(next) => set("isNewArrival", next)} />
        <ToggleField label="Best seller" checked={value.isBestSeller ?? false} onChange={(next) => set("isBestSeller", next)} />
        <ToggleField label="Contract grade" checked={value.isContractGrade ?? false} onChange={(next) => set("isContractGrade", next)} />
        <ToggleField label="Customizable" checked={value.isCustomizable ?? false} onChange={(next) => set("isCustomizable", next)} />
        <ToggleField label="Price on request" checked={value.isPriceOnRequest ?? false} onChange={(next) => set("isPriceOnRequest", next)} />
      </div>
    </div>
  </section>;
}
