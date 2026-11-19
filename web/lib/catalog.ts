export type ProductMedia = { url: string; alt?: string | null; isPrimary?: boolean; type?: string };
export type ProductSpecification = {
  title?: string;
  image?: string | null;
  specs?: { id: string; label: string; value: string }[];
};
export type ProductVariantOption = {
  attributeId?: string;
  attributeOptionId?: string;
  attributeName?: string | null;
  displayValue?: string | null;
  displayImage?: string | null;
  swatch?: string | null;
};
export type ProductVariant = {
  id: string;
  name: string;
  price: number | string;
  isDefault?: boolean;
  stockQty?: number;
  stockStatus?: string;
  isOnSale?: boolean;
  media?: ProductMedia[];
  variantOptions?: ProductVariantOption[];
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPriceOnRequest?: boolean;
  avgRating?: number | string | null;
  totalReviews?: number;
  features?: string[];
  careItems?: { id: string; title: string; description?: string | null; displayOrder: number }[];
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string } | null;
  specification?: ProductSpecification | null;
  variants?: ProductVariant[];
};

export type ProductDetailVariant = ProductVariant & {
  description?: string | null;
  features?: string[];
  specification?: ProductSpecification | null;
  arAsset?: { modelUrl: string; usdzUrl?: string | null; placement: string } | null;
};

export type ProductDetail = Omit<CatalogProduct, "variants"> & {
  variants?: ProductDetailVariant[];
  assemblyRequired?: boolean;
  assemblyDuration?: number | null;
  assemblyPdfUrl?: string | null;
  guaranteeDays?: number | null;
  guaranteeLabel?: string | null;
  guaranteeUrl?: string | null;
  pairSources?: { heading?: string | null; pairedProduct: CatalogProduct }[];
};

export function defaultVariant<Variant extends ProductVariant>(product: { variants?: Variant[] }) {
  return product.variants?.find((variant) => variant.isDefault) ?? product.variants?.[0];
}

export function purchaseLimit(product: CatalogProduct, variant?: ProductVariant) {
  return !product.isPriceOnRequest && variant && ["IN_STOCK", "LOW_STOCK"].includes(variant.stockStatus ?? "")
    ? Math.min(99, variant.stockQty ?? 0)
    : 0;
}

export function variantImage(variant?: ProductVariant) {
  const images = variant?.media?.filter((image) => image.type?.toLowerCase() !== "video");
  return images?.find((image) => image.isPrimary) ?? images?.[0];
}

export function catalogImageUrl(value?: string | null) {
  const source = value?.trim();
  if (!source) return;
  if (source.startsWith("/") && !source.startsWith("//")) return source;

  try {
    const url = new URL(source);
    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    if (["localhost", "127.0.0.1"].includes(url.hostname) && url.pathname.startsWith("/assets/")) {
      return url.pathname + url.search;
    }
    return url.href;
  } catch {
    return;
  }
}
