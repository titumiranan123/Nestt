"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { siteFont } from "@/lib/fonts";
import { defaultVariant, type ProductDetail } from "@/lib/catalog";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchasePanel } from "./ProductPurchasePanel";
import { ProductInfoDrawer, type ProductInfoSection } from "./ProductInfoDrawer";

export function ProductDetailsPage({ product }: { product: ProductDetail }) {
  const searchParams = useSearchParams();
  const [variantId, setVariantId] = useState(() => searchParams.get("variant"));
  const [activeInfo, setActiveInfo] = useState<ProductInfoSection | null>(null);
  const variant = product.variants?.find((item) => item.id === variantId) ?? defaultVariant(product);

  function selectVariant(id: string) {
    setVariantId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", id);
    window.history.replaceState(null, "", url);
  }

  const specs = new Map(
    (product.specification?.specs ?? []).map((item) => [item.label.toLowerCase(), item]),
  );
  for (const item of variant?.specification?.specs ?? []) {
    specs.set(item.label.toLowerCase(), item);
  }
  const specification = {
    specs: Array.from(specs.values()),
    image: variant?.specification?.image || product.specification?.image,
  };
  const description = variant?.description || product.description;
  const features = [...new Set([...(product.features ?? []), ...(variant?.features ?? [])])];
  const information: ProductInfoSection[] = [];
  if (description) information.push("Description");
  if (features.length) information.push("Features");
  if (specification.image || specs.size) information.push("Specifications");
  if (product.careItems?.length) information.push("Care & maintenance");

  return (
    <main className={`${siteFont.className} mx-auto max-w-[1444px] px-4 pb-8 pt-3 text-[#191919] lg:px-[18px] lg:pt-4`}>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] md:gap-7 lg:gap-[clamp(32px,3.6vw,52px)]">
        <ProductGallery
          key={variant?.id ?? product.id}
          variant={variant}
          productName={product.name}
          onDimensions={information.includes("Specifications") ? () => setActiveInfo("Specifications") : undefined}
        />
        <ProductPurchasePanel
          product={product}
          variant={variant}
          onVariantChange={selectVariant}
          description={description}
          information={information}
          onInfo={setActiveInfo}
        />
      </div>
      <ProductInfoDrawer
        activeInfo={activeInfo}
        description={description}
        features={features}
        specification={specification}
        careItems={product.careItems}
        onClose={() => setActiveInfo(null)}
      />
    </main>
  );
}
