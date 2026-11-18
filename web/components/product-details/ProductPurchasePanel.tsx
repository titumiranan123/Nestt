"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { AccountApiError, accountApi } from "@/lib/account/api";
import { money } from "@/lib/account/data";
import { purchaseLimit, type ProductDetail, type ProductDetailVariant } from "@/lib/catalog";
import { ProductCollectionSection } from "./ProductCollectionSection";
import { PlusIcon, ProductIcon } from "./ProductDetailsIcons";
import type { ProductInfoSection } from "./ProductInfoDrawer";
import { ProductOptions } from "./ProductOptions";

export function ProductPurchasePanel({
  product, variant, onVariantChange, description, information, onInfo,
}: {
  product: ProductDetail;
  variant?: ProductDetailVariant;
  onVariantChange: (id: string) => void;
  description?: string | null;
  information: ProductInfoSection[];
  onInfo: (section: ProductInfoSection) => void;
}) {
  const { items, addItem } = useCart();
  const [requestedQuantity, setQuantity] = useState(1);
  const [cartError, setCartError] = useState("");
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [wishError, setWishError] = useState<"signin" | "retry">();
  const [wishPending, setWishPending] = useState(true);
  const saving = useRef(false);
  const rating = Number(product.avgRating);
  const stock = purchaseLimit(product, variant);
  const inCart = items.find((item) => "variantId" in item && item.variantId === variant?.id)?.quantity ?? 0;
  const available = Math.max(0, stock - inCart);
  const quantity = Math.min(requestedQuantity, Math.max(1, available));
  const isSaved = !!variant && saved.has(variant.id);
  const price = Number(variant?.price);
  const guarantee = product.guaranteeLabel || (product.guaranteeDays ? `${product.guaranteeDays}-day guarantee` : "");
  const guaranteeUrl = product.guaranteeUrl?.trim();
  const guaranteeHref = guaranteeUrl && /^(https?:\/\/|\/(?!\/))/i.test(guaranteeUrl) ? guaranteeUrl : undefined;

  useEffect(() => {
    let active = true;
    void accountApi.wishlist()
      .then((items) => { if (active) setSaved(new Set(items.map((item) => item.variantId))); })
      .catch(() => {})
      .finally(() => { if (active) setWishPending(false); });
    return () => { active = false; };
  }, []);

  async function toggleWishlist() {
    if (!variant || saving.current || wishPending) return;
    saving.current = true;
    setWishPending(true);
    setWishError(undefined);
    const { id } = variant;
    try {
      if (isSaved) await accountApi.removeWish(id);
      else await accountApi.saveWish(id);
      setSaved((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(id);
        else next.add(id);
        return next;
      });
    } catch (error) {
      setWishError(error instanceof AccountApiError && error.status === 401 ? "signin" : "retry");
    } finally {
      saving.current = false;
      setWishPending(false);
    }
  }

  function addToCart() {
    if (!variant || available < quantity) return;
    try {
      addItem(variant.id, quantity, stock);
      setCartError("");
      setQuantity(1);
    } catch (error) {
      setCartError(error instanceof Error ? error.message : "Could not add this item to your cart.");
    }
  }

  return (
    <section aria-label="Product details" className="min-w-0 md:pt-3 lg:pt-6">
      <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-xs leading-[18px] text-[#777]">
        <Link href="/" className="hover:underline">Home</Link><span aria-hidden="true">›</span>
        <Link href="/products" className="hover:underline">Furniture</Link>
        {product.category && <><span aria-hidden="true">›</span>
          <Link href={`/products?category=${encodeURIComponent(product.category.slug)}`} className="hover:underline">{product.category.name}</Link>
        </>}
      </nav>
      <h1 className="text-[28px] font-medium leading-[1.2] tracking-[-0.02em] lg:text-[36px] lg:leading-[43px]">{product.name}</h1>
      {description && <p className="mt-0.5 line-clamp-2 text-xs leading-[18px] text-[#555]">{description}</p>}
      {rating > 0 && !!product.totalReviews && <div className="mt-1 flex items-center gap-1 text-sm leading-6">
        <span aria-hidden="true" className="text-[22px] leading-none text-[#f79900]">★</span>
        <strong className="font-semibold">{rating.toFixed(1)}</strong>
        <span className="text-[#717171]">({product.totalReviews} reviews)</span>
      </div>}

      <div className="mt-5 lg:mt-[22px]">
        {variant && product.variants?.length && <ProductOptions variants={product.variants} selected={variant} onChange={(id) => {
          onVariantChange(id);
          setQuantity(1);
          setCartError("");
          setWishError(undefined);
        }} />}
        {information.map((section) => (
          <button key={section} type="button" aria-haspopup="dialog" onClick={() => onInfo(section)}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between border-b border-[#e5e5ea] text-left text-sm font-semibold hover:text-[#b2421b] lg:min-h-[57px] lg:text-base">
            {section}<PlusIcon className="size-5 text-[#505050]" />
          </button>
        ))}
      </div>

      <div className="mt-3 flex min-h-10 flex-wrap items-center justify-between gap-x-2 gap-y-1 lg:mt-4">
        <strong className="text-xl font-bold leading-tight lg:text-2xl">
          {product.isPriceOnRequest ? "Price on request" : Number.isFinite(price) ? money(price).replace("৳", "৳ ") : "Price unavailable"}
        </strong>
        {variant && !product.isPriceOnRequest && <div className="ml-auto flex items-center gap-2 text-[12px] text-[#303030] lg:text-sm">
          <span>QTY:</span>
          <div className="flex h-9 items-center bg-[#f7f7f7] text-[#222] lg:h-10">
            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}
              className="h-full w-9 cursor-pointer text-lg text-[#666] disabled:cursor-default disabled:text-[#939393] lg:w-10">−</button>
            <span aria-live="polite" className="grid h-full min-w-9 place-items-center border border-[#e5e5ea] bg-white text-sm lg:min-w-10 lg:text-base">{String(quantity).padStart(2, "0")}</span>
            <button type="button" aria-label="Increase quantity" disabled={quantity >= available} onClick={() => setQuantity(quantity + 1)}
              className="h-full w-9 cursor-pointer text-lg text-[#666] disabled:cursor-default disabled:text-[#939393] lg:w-10">+</button>
          </div>
        </div>}
      </div>

      <div className="mt-3 flex gap-2 lg:mt-5 lg:gap-3">
        <button type="button" onClick={addToCart} disabled={!variant || !available || !Number.isFinite(price)}
          className="h-11 flex-1 cursor-pointer bg-[#f15a22] px-3 text-sm font-semibold text-white hover:bg-[#d74a15] disabled:cursor-not-allowed disabled:bg-[#bcb9b3] lg:h-[52px] lg:text-base">
          Add to Cart
        </button>
        <button type="button" onClick={toggleWishlist} disabled={!variant || wishPending} aria-pressed={isSaved}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center bg-[#f7f7f7] text-[#595959] hover:text-[#f15a22] aria-pressed:text-[#f15a22] disabled:cursor-default lg:size-[52px]">
          <ProductIcon kind="heart" className="size-6" />
        </button>
      </div>
      {cartError && <p role="alert" className="mt-2 text-[11px] text-[#a04433]">{cartError}</p>}
      {wishError && <p role="status" className="mt-2 text-[11px] text-[#a04433]">
        {wishError === "signin"
          ? <><Link href="/account/wishlist" className="underline">Sign in</Link> to save to your wishlist.</>
          : "Could not update your wishlist. Try again."}
      </p>}

      <div className="mt-4 space-y-2 text-sm leading-5 text-[#303030] lg:mt-5 lg:space-y-[11px] lg:text-base">
        {variant && !product.isPriceOnRequest && <p className="flex items-center gap-1.5">
          <ProductIcon kind="chair" className="size-5 shrink-0" /><span>{available ? "Available" : stock ? "Available quantity already in your cart" : variant.stockStatus === "PREORDER" ? "Preorder" : "Out of stock"}</span>
        </p>}
        <p className="flex items-center gap-1.5"><ProductIcon kind="truck" className="size-5 shrink-0" /><span>Delivery options at checkout</span></p>
        {guarantee && <p className="flex items-center gap-1.5">
          <ProductIcon kind="shield" className="size-5 shrink-0" />{guaranteeHref ? <a href={guaranteeHref} className="text-[#ba481b] underline underline-offset-2">{guarantee}</a> : <span>{guarantee}</span>}
        </p>}
      </div>
      {!!product.pairSources?.length && <ProductCollectionSection pairs={product.pairSources} />}
    </section>
  );
}
