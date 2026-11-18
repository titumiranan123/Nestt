import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductDetailsPage } from "@/components/product-details/ProductDetailsPage";
import type { ProductDetail } from "@/lib/catalog";

const getProduct = cache(async (slug: string): Promise<ProductDetail> => {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backend) throw new Error("Product service is not configured");
  const response = await fetch(`${backend}/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Product service is unavailable");
  return response.json();
});

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product.name, description: product.description ?? undefined };
}

export default function Page({ params }: PageProps<"/products/[slug]">) {
  return (
    <div className="min-h-dvh bg-white">
      <Suspense fallback={<p className="py-20 text-center text-sm">Loading product…</p>}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const {
    id, name, description, features, careItems, category, brand, specification, isPriceOnRequest,
    avgRating, totalReviews, guaranteeDays, guaranteeLabel, guaranteeUrl, pairSources, variants,
  } = await getProduct(slug);
  const product: ProductDetail = {
    id, name, slug, description, features, careItems, category, brand, specification, isPriceOnRequest,
    avgRating, totalReviews, guaranteeDays, guaranteeLabel, guaranteeUrl, pairSources,
    variants: variants?.map(({
      id, name, price, isDefault, stockQty, stockStatus, media, variantOptions,
      description, features, specification, arAsset,
    }) => ({
      id, name, price, isDefault, stockQty, stockStatus, description, features, specification, arAsset,
      media: media?.map(({ url, alt, isPrimary, type }) => ({ url, alt, isPrimary, type })),
      variantOptions: variantOptions?.map(({
        attributeId, attributeOptionId, attributeName, displayValue, displayImage, swatch,
      }) => ({ attributeId, attributeOptionId, attributeName, displayValue, displayImage, swatch })),
    })),
  };
  return <ProductDetailsPage key={product.id} product={product} />;
}
