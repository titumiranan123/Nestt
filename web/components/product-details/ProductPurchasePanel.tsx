"use client";

import { useState } from "react";
import { ProductCollectionSection } from "./ProductCollectionSection";
import { ProductIcon, PlusIcon } from "./ProductDetailsIcons";
import { ProductInfoDrawer } from "./ProductInfoDrawer";
import { ProductOptions } from "./ProductOptions";
import { productDetailsProduct } from "./product-details-data";
import type { ProductInfoSection } from "./product-details-data";

const informationSections: ProductInfoSection[] = ["Description", "Features", "Specifications"];

export function ProductPurchasePanel() {
  const [quantity, setQuantity] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [size, setSize] = useState("10ft Two-Cushion Sofa");
  const [fabric, setFabric] = useState("Tatum Slate (Boucle)");
  const [activeInfo, setActiveInfo] = useState<ProductInfoSection | null>(null);

  return (
    <div className="min-w-0 md:pt-3">
      <nav aria-label="Breadcrumb" className="mb-2 text-[9px] text-[#777]">Home › Living › Sofa</nav>
      <h1 className="max-w-[340px] text-[23px] font-medium leading-[1.08] tracking-[-0.035em] sm:text-[20px] lg:text-[26px]">{productDetailsProduct.name}</h1>
      <p className="mt-1 text-[9px] leading-4 text-[#777]">{productDetailsProduct.subtitle}</p>
      <div className="mt-1 flex items-center gap-1 text-[9px]">
        <span className="text-[14px] leading-none text-[#f39200]">★</span>
        <strong className="font-semibold">4.9</strong>
        <span className="text-[#888]">(92 reviews)</span>
      </div>

      <div className="mt-2">
        <ProductOptions size={size} fabric={fabric} onSizeChange={setSize} onFabricChange={setFabric} />
        {informationSections.map((title) => (
          <button
            key={title}
            type="button"
            aria-haspopup="dialog"
            onClick={() => setActiveInfo(title)}
            className="flex min-h-[31px] w-full cursor-pointer items-center border-b border-[#e9e9e9] text-left text-[11px] font-semibold text-[#292929] hover:text-[#f15a22]"
          >
            <span className="flex-1">{title}</span>
            <PlusIcon className="size-[14px] text-[#777]" />
          </button>
        ))}
      </div>

      <PriceAndQuantity
        quantity={quantity}
        onQuantityChange={setQuantity}
      />
      <PurchaseActions
        added={added}
        isSaved={isSaved}
        onAddToCart={() => setAdded(true)}
        onToggleSaved={() => setIsSaved(!isSaved)}
      />
      <DeliveryBenefits />
      <ProductCollectionSection />

      <ProductInfoDrawer
        activeInfo={activeInfo}
        size={size}
        fabric={fabric}
        onClose={() => setActiveInfo(null)}
      />
    </div>
  );
}

function PriceAndQuantity({ quantity, onQuantityChange }: { quantity: number; onQuantityChange: (quantity: number) => void }) {
  return (
    <div className="mt-2 flex min-h-[37px] items-center border-b border-[#e8e8e8]">
      <div className="flex flex-1 items-baseline gap-1.5">
        <strong className="text-[14px] font-bold">{productDetailsProduct.price}</strong>
        <del className="text-[8px] text-[#999]">{productDetailsProduct.oldPrice}</del>
        <span className="border border-[#f3b2a0] px-1 py-0.5 text-[7px] font-semibold text-[#ed5121]">SAVE 12%</span>
      </div>
      <span className="mr-1 text-[8px] text-[#555]">QTY:</span>
      <div className="flex h-[25px] items-center border border-[#e4e4e4] text-[10px]">
        <button type="button" aria-label="Decrease quantity" onClick={() => onQuantityChange(Math.max(1, quantity - 1))} className="flex h-full w-6 cursor-pointer items-center justify-center text-[#888] hover:text-black">−</button>
        <span aria-live="polite" className="flex h-full w-7 items-center justify-center border-x border-[#e4e4e4]">{String(quantity).padStart(2, "0")}</span>
        <button type="button" aria-label="Increase quantity" onClick={() => onQuantityChange(quantity + 1)} className="flex h-full w-6 cursor-pointer items-center justify-center text-[#888] hover:text-black">+</button>
      </div>
    </div>
  );
}

function PurchaseActions({ added, isSaved, onAddToCart, onToggleSaved }: { added: boolean; isSaved: boolean; onAddToCart: () => void; onToggleSaved: () => void }) {
  return (
    <div className="mt-2 flex gap-1.5">
      <button type="button" onClick={onAddToCart} className={`flex h-[36px] flex-1 cursor-pointer items-center justify-center gap-2 text-[10px] font-semibold text-white transition-colors ${added ? "bg-[#415e46]" : "bg-[#f15a22] hover:bg-[#da4d17]"}`}>
        {added ? "Added to Cart ✓" : "Add to Cart"}
      </button>
      <button type="button" onClick={onToggleSaved} aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={isSaved} className={`flex size-[36px] cursor-pointer items-center justify-center border border-[#e5e5e5] ${isSaved ? "text-[#f15a22]" : "text-[#666] hover:text-[#f15a22]"}`}>
        <ProductIcon kind="heart" />
      </button>
    </div>
  );
}

function DeliveryBenefits() {
  return (
    <div className="mt-2 space-y-1 text-[9px] text-[#555]">
      <p className="flex items-center gap-1.5"><ProductIcon kind="chair" /><span>Available</span></p>
      <p className="flex items-center gap-1.5"><ProductIcon kind="truck" /><span>Delivered to <a href="/#showrooms" className="cursor-pointer text-[#f15a22] underline underline-offset-2">Mirpur Dohs, Dhaka</a> · Nov 7–17th</span></p>
      <p className="flex items-center gap-1.5"><ProductIcon kind="shield" /><span>30 Day <a href="/#returns" className="cursor-pointer text-[#f15a22] underline underline-offset-2">satisfaction guarantee.</a></span></p>
    </div>
  );
}
