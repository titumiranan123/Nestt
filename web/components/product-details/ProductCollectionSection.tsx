"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/lib/account/data";
import { catalogImageUrl, defaultVariant, purchaseLimit, variantImage, type ProductDetail } from "@/lib/catalog";
import { ProductIcon } from "./ProductDetailsIcons";

export function ProductCollectionSection({ pairs }: { pairs: NonNullable<ProductDetail["pairSources"]> }) {
  const { items, addItem } = useCart();
  const [error, setError] = useState("");

  return (
    <details open className="group mt-6 lg:mt-[34px]">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold leading-6 lg:text-base [&::-webkit-details-marker]:hidden">
        {pairs[0]?.heading || "Matches Well With"}
        <span aria-hidden="true" className="mr-0.5 text-xl font-normal text-[#555] group-open:hidden">+</span>
        <span aria-hidden="true" className="mr-0.5 hidden text-xl font-normal text-[#555] group-open:inline">−</span>
      </summary>
      <div className="mt-3 grid gap-2 lg:mt-4">
        {pairs.map(({ pairedProduct: product }) => {
          const variant = defaultVariant(product);
          const image = catalogImageUrl(variantImage(variant)?.url);
          const rating = Number(product.avgRating);
          const stock = purchaseLimit(product, variant);
          const inCart = items.find((item) => "variantId" in item && item.variantId === variant?.id)?.quantity ?? 0;

          return (
            <article key={product.id} className="flex min-h-20 items-center gap-2 bg-[#f9f9f9] p-2 lg:min-h-[116px] lg:gap-4">
              <Link href={`/products/${encodeURIComponent(product.slug)}`} prefetch={false} className="flex min-w-0 flex-1 items-center gap-2 hover:underline lg:gap-4">
                <div className="h-16 w-14 shrink-0 bg-[#eeedea] lg:h-[100px] lg:w-20">
                  {image && <img src={image} alt="" loading="lazy" className="size-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold lg:text-base">{product.name}</h3>
                  {rating > 0 && !!product.totalReviews && <p className="mt-0.5 flex items-center gap-1 text-xs text-[#707070] lg:text-sm"><span aria-hidden="true" className="text-[22px] leading-none text-[#f79900]">★</span> <strong className="text-[#191919]">{rating.toFixed(1)}</strong> ({product.totalReviews} reviews)</p>}
                  <p className="mt-2 text-sm font-bold lg:mt-3.5 lg:text-base">
                    {product.isPriceOnRequest ? "Price on request" : variant ? money(Number(variant.price)).replace("৳", "৳ ") : "Price unavailable"}
                  </p>
                </div>
              </Link>
              <button type="button" aria-label={`Add ${product.name} to cart`} disabled={!variant || stock <= inCart}
                onClick={() => {
                  if (!variant) return;
                  try {
                    addItem(variant.id, 1, stock);
                    setError("");
                  } catch (error) {
                    setError(error instanceof Error ? error.message : "Could not add this item to your cart.");
                  }
                }}
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center border border-[#f15a22] bg-white text-[#f15a22] hover:bg-[#fff1eb] disabled:cursor-default disabled:border-[#ddd] disabled:text-[#777] lg:size-[52px]">
                <ProductIcon kind="cart" className="size-6" />
              </button>
            </article>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-2 text-[11px] text-[#a04433]">{error}</p>}
    </details>
  );
}
