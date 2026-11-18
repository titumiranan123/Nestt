"use client";

import { useState } from "react";
import { catalogImageUrl, type ProductDetailVariant } from "@/lib/catalog";
import { PlusIcon } from "./ProductDetailsIcons";

type Choice = { id: string; label: string; image?: string; swatch?: string | null };
type Group = { label: string; choices: Map<string, Choice> };

export function ProductOptions({
  variants,
  selected,
  onChange,
}: {
  variants: ProductDetailVariant[];
  selected: ProductDetailVariant;
  onChange: (id: string) => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const groups = new Map<string, Group>();
  const selections = new Map<string, Map<string, string>>();

  for (const variant of variants) {
    const values = new Map<string, string>();
    for (const option of variant.variantOptions ?? []) {
      const { attributeId, attributeOptionId, attributeName, displayValue, displayImage, swatch } = option;
      if (!attributeId || !attributeOptionId || !attributeName || !displayValue) continue;

      const group = groups.get(attributeId) ?? { label: attributeName, choices: new Map<string, Choice>() };
      group.choices.set(attributeOptionId, {
        id: attributeOptionId, label: displayValue, image: catalogImageUrl(displayImage), swatch,
      });
      groups.set(attributeId, group);
      values.set(attributeId, attributeOptionId);
    }
    selections.set(variant.id, values);
  }

  // Preserve access to legacy variants and variants that share the same attributes.
  const combinations = variants.map((variant) => {
    const values = selections.get(variant.id);
    return Array.from(groups.keys(), (key) => values?.get(key) ?? "");
  });
  const needsVariantSelector = combinations.some((values) => !values.length || values.includes(""))
    || new Set(combinations.map((values) => JSON.stringify(values))).size !== variants.length;

  const selectedValues = selections.get(selected.id);

  function choose(groupId: string, choiceId: string) {
    if (groupId === "variant") {
      onChange(choiceId);
    } else {
      let best: ProductDetailVariant | undefined;
      let bestScore = -1;
      for (const variant of variants) {
        const values = selections.get(variant.id);
        if (values?.get(groupId) !== choiceId) continue;
        const score = Array.from(values).filter(([key, value]) => key !== groupId && selectedValues?.get(key) === value).length;
        if (score > bestScore) {
          best = variant;
          bestScore = score;
        }
      }
      if (best) onChange(best.id);
    }
    setOpenGroup(null);
  }

  const rows = needsVariantSelector
    ? [{
        id: "variant", label: "Options", selectedId: selected.id,
        choices: variants.map(({ id, name }) => ({ id, label: name } as Choice)),
      }]
    : Array.from(groups, ([id, group]) => ({
        id, label: group.label, selectedId: selectedValues?.get(id), choices: Array.from(group.choices.values()),
      }));

  return rows.map(({ id, label, selectedId, choices }) => {
    const isOpen = openGroup === id;
    const selectedChoice = choices.find((choice) => choice.id === selectedId);
    const swatches = choices.filter((choice) => choice.image || choice.swatch);

    return (
      <div key={id} className={`border-b border-[#e5e5ea] py-2.5 ${swatches.length ? "lg:py-[18px]" : "lg:py-4"}`}>
        <button type="button" aria-expanded={isOpen} onClick={() => setOpenGroup(isOpen ? null : id)}
          className="flex min-h-5 w-full cursor-pointer items-center text-left text-sm font-semibold leading-5 lg:text-base">
          <span className="flex-1">{label} <span className="ml-1 text-[11px] font-normal text-[#737373] lg:text-xs">{choices.length} {choices.length === 1 ? "Option" : "Options"}</span></span>
          <PlusIcon className={`size-5 text-[#505050] transition-transform ${isOpen ? "rotate-45" : ""}`} />
        </button>
        <div className="flex min-h-5 items-start justify-between gap-2 text-xs leading-5 text-[#303030] lg:text-sm">
          <span>{selectedChoice?.label}</span>
          {!!swatches.length && <div className="min-w-0 shrink-0">
            <button type="button" aria-expanded={isOpen} aria-label={`More ${label} options`}
              onClick={() => setOpenGroup(isOpen ? null : id)} className="block cursor-pointer text-xs leading-[18px] text-[#737373] hover:underline">
              +more options
            </button>
            <div className="mt-0.5 flex max-w-32 flex-wrap gap-px">
              {swatches.map((choice) => (
                <button key={choice.id} type="button" onClick={() => choose(id, choice.id)}
                  aria-label={`Select ${label}: ${choice.label}`} aria-pressed={selectedId === choice.id}
                  className="flex size-[15px] cursor-pointer items-center justify-center aria-pressed:outline aria-pressed:outline-offset-[-1px] aria-pressed:outline-[#222]"
                  style={{ backgroundColor: choice.swatch ?? "#efeee9" }}>
                  {choice.image && <img src={choice.image} alt="" className="size-full object-cover" />}
                </button>
              ))}
            </div>
          </div>}
        </div>
        {isOpen && <div className="mt-2 flex flex-wrap gap-1.5">
          {choices.map((choice) => (
            <button type="button" key={choice.id} aria-pressed={selectedId === choice.id} onClick={() => choose(id, choice.id)}
              className="cursor-pointer border border-[#ddd] px-2 py-1 text-[11px] hover:border-[#999] aria-pressed:border-[#f15a22] aria-pressed:text-[#a93917]">
              {choice.label}
            </button>
          ))}
        </div>}
      </div>
    );
  });
}
