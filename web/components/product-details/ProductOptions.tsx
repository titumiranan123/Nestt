"use client";

import { useState } from "react";
import { PlusIcon } from "./ProductDetailsIcons";
import { productFabrics, productSizes } from "./product-details-data";

export function ProductOptions({
  size,
  fabric,
  onSizeChange,
  onFabricChange,
}: {
  size: string;
  fabric: string;
  onSizeChange: (value: string) => void;
  onFabricChange: (value: string) => void;
}) {
  const [openOptions, setOpenOptions] = useState<"size" | "fabric" | null>(null);

  function toggleOptions(option: "size" | "fabric") {
    setOpenOptions(openOptions === option ? null : option);
  }

  return (
    <div>
      <div className="border-b border-[#e9e9e9]">
        <button
          type="button"
          aria-expanded={openOptions === "size"}
          onClick={() => toggleOptions("size")}
          className="flex min-h-[31px] w-full cursor-pointer items-center text-left text-[11px] font-semibold"
        >
          <span className="flex-1">Size <span className="ml-1 text-[9px] font-normal text-[#888]">6 Options</span></span>
          <span className={`text-[#777] transition-transform ${openOptions === "size" ? "rotate-45" : ""}`}><PlusIcon className="size-[14px]" /></span>
        </button>
        <p className="pb-2 text-[9px] text-[#555]">{size}</p>
        {openOptions === "size" && (
          <div className="flex flex-wrap gap-1.5 pb-2">
            {productSizes.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => { onSizeChange(option); setOpenOptions(null); }}
                className={`cursor-pointer border px-2 py-1 text-[9px] ${size === option ? "border-[#f15a22] text-[#e8531c]" : "border-[#ddd] hover:border-[#999]"}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-[#e9e9e9]">
        <button
          type="button"
          aria-expanded={openOptions === "fabric"}
          onClick={() => toggleOptions("fabric")}
          className="flex min-h-[31px] w-full cursor-pointer items-center text-left text-[11px] font-semibold"
        >
          <span className="flex-1">Fabric <span className="ml-1 text-[9px] font-normal text-[#888]">6 Options</span></span>
          <span className={`text-[#777] transition-transform ${openOptions === "fabric" ? "rotate-45" : ""}`}><PlusIcon className="size-[14px]" /></span>
        </button>
        <div className="flex items-start justify-between gap-2 pb-2">
          <span className="text-[9px] text-[#555]">{fabric}</span>
          <span className="flex flex-col items-end gap-1">
            <span className="text-[8px] text-[#888]">+ more options</span>
            <span className="flex gap-0.5">
              {productFabrics.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => onFabricChange(option.name)}
                  aria-label={`Select fabric ${option.name}`}
                  aria-pressed={fabric === option.name}
                  className={`size-[9px] cursor-pointer border border-black/10 ${fabric === option.name ? "ring-1 ring-[#262626] ring-offset-1" : ""}`}
                  style={{ backgroundColor: option.color }}
                />
              ))}
            </span>
          </span>
        </div>
        {openOptions === "fabric" && (
          <div className="flex flex-wrap gap-1.5 pb-2">
            {productFabrics.map((option) => (
              <button
                type="button"
                key={option.name}
                onClick={() => { onFabricChange(option.name); setOpenOptions(null); }}
                className={`cursor-pointer border px-2 py-1 text-[9px] ${fabric === option.name ? "border-[#f15a22] text-[#e8531c]" : "border-[#ddd] hover:border-[#999]"}`}
              >
                {option.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
