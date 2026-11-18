"use client";

import { useEffect, useState } from "react";
import { defaultVariant, type CatalogProduct } from "@/lib/catalog";
import { useCart } from "./CartProvider";

export function useCartCatalog() {
  const { items, ready, migrateItems } = useCart();
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Products unavailable");
        const products = await response.json() as CatalogProduct[];
        if (controller.signal.aborted) return;
        setCatalog(products);
        migrateItems(products);
      })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [migrateItems]);

  const rows = items.map((item) => {
    const product = "variantId" in item
      ? catalog.find((candidate) => candidate.variants?.some((variant) => variant.id === item.variantId))
      : catalog.find((candidate) => candidate.id === item.productId);
    const variant = product && ("variantId" in item
      ? product.variants?.find((candidate) => candidate.id === item.variantId)
      : defaultVariant(product));
    return { item, product, variant };
  });

  return { rows, loading: loading || !ready, loadError };
}
