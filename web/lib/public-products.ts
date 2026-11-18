import "server-only";
import type { CatalogProduct } from "./catalog";

export async function loadProductCollection(collection: "recommended" | "new-arrivals"): Promise<CatalogProduct[] | null> {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backend) return null;

  try {
    const response = await fetch(`${backend}/products/collections/${collection}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return null;
    const products: unknown = await response.json();
    return Array.isArray(products) ? products : null;
  } catch {
    return null;
  }
}
