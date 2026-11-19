"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ProductSpecificationInput, SpecificationItemType } from "@/features/products/types";
import { confirmAdminAction } from "@/lib/admin-swal";
import { SelectField, TextField } from "./ProductFormFields";

const emptySpecification = (): ProductSpecificationInput => ({ specs: [] });

export function ProductSpecificationEditor({
  value,
  onChange,
  title = "Specifications",
  hint = "Variant values replace product values with the same label.",
}: {
  value?: ProductSpecificationInput | null;
  onChange: (value: ProductSpecificationInput) => void;
  title?: string;
  hint?: string;
}) {
  const specification = value ?? emptySpecification();

  const updateItem = (index: number, patch: Partial<ProductSpecificationInput["specs"][number]>) => {
    onChange({
      ...specification,
      specs: specification.specs.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    });
  };
  const removeItem = async (index: number) => {
    const name = specification.specs[index].label.trim() || `specification ${index + 1}`;
    if (!await confirmAdminAction(`Remove ${name}?`, "This specification will be removed when you save the product.")) return;
    const specs = specification.specs.filter((_, itemIndex) => itemIndex !== index).map((item, sortOrder) => ({ ...item, sortOrder }));
    onChange({ ...specification, specs });
  };

  return (
    <section className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...specification, specs: [...specification.specs, { label: "", value: "", type: "TEXT", sortOrder: specification.specs.length }] })}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-brand/20 px-2.5 text-xs font-semibold text-brand hover:bg-brand-soft"
        >
          <Plus size={14} /> Add spec
        </button>
      </div>

      {specification.specs.length > 0 ? (
        <div className="space-y-3">
          {specification.specs.map((item, index) => (
            <div key={`spec-${index}`} className="grid gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2 xl:grid-cols-[1fr_1.2fr_150px_40px]">
              <TextField label="Label" value={item.label} onChange={(next) => updateItem(index, { label: next })} placeholder="e.g. Frame" />
              <TextField label="Value" value={item.value} onChange={(next) => updateItem(index, { value: next })} placeholder="e.g. Solid teak" />
              <SelectField
                label="Value type"
                value={item.type ?? "TEXT"}
                onChange={(next) => updateItem(index, { type: next as SpecificationItemType })}
                options={[{ value: "TEXT", label: "Text" }, { value: "NUMBER", label: "Number" }, { value: "BOOLEAN", label: "Yes / no" }]}
              />
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => void removeItem(index)}
                  aria-label={`Remove specification ${item.label || index + 1}`}
                  className="mb-0.5 rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="sm:col-span-2 xl:col-span-4">
                <TextField label="Link (optional)" value={item.href ?? ""} onChange={(next) => updateItem(index, { href: next || null })} placeholder="Optional details URL" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-5 text-center text-xs text-gray-500">No specifications added.</p>
      )}
    </section>
  );
}
