"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { accountApi, AccountApiError } from "@/lib/account/api";
import { HomePageHeartIcon } from "@/components/home-page/nestt-furniture-home-page-icons";
import { defaultVariant, purchaseLimit, variantImage, type CatalogProduct as Product, type ProductVariant } from "@/lib/catalog";

type Category = { id: string; name: string; slug: string; logo?: string | null; parent?: { id: string; name: string; slug: string } | null };

const categoryOrder = ["sofas-sectionals", "chairs-ottomans", "tables", "storage-cabinets"];
const categoryFallbackImages: Record<string, string> = {
  "sofas-sectionals": "/assets/rooms/living-room.jpg",
  "chairs-ottomans": "/assets/categories/chairs.jpg",
  tables: "/assets/categories/tables.jpg",
  "beds-bedroom": "/assets/rooms/bedroom.jpg",
  "storage-cabinets": "/assets/categories/storage.jpg",
  lighting: "/assets/categories/lighting.jpg",
  "rugs-decor": "/assets/categories/decor.jpg",
};

function displayCategoryName(category: Category) {
  if (category.slug === "chairs-ottomans") return "Chairs";
  if (category.slug === "storage-cabinets") return "Cabinets";
  return category.name;
}

function imageForProduct(product: Product, variant?: ProductVariant) {
  const media = variantImage(variant);
  return media?.url ?? categoryFallbackImages[product.category?.slug ?? ""] ?? "/assets/hero/quality-living-room.webp";
}

function inStock(product: Product) {
  const variants = product.variants ?? [];
  return variants.some((variant) => variant.stockStatus !== "OUT_OF_STOCK" && (variant.stockQty === undefined || variant.stockQty > 0));
}

function priceOf(product: Product) {
  const prices = (product.variants ?? []).map((variant) => Number(variant.price)).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : 0;
}

function money(amount: number) {
  return `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function ProductsListingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [priceRange, setPriceRange] = useState("all");
  const [sort, setSort] = useState("featured");
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [wishPending, setWishPending] = useState<string | null>(null);
  const [wishFeedback, setWishFeedback] = useState<{ message: string; signIn?: boolean } | null>(null);
  const pending = useRef(false);
  const { addItem } = useCart();

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);
      if (!productResponse.ok) throw new Error("Could not load the furniture catalog.");
      const [productData, categoryData] = await Promise.all([productResponse.json(), categoryResponse.ok ? categoryResponse.json() : Promise.resolve([])]);
      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData.filter((item: Category) => !item.parent) : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the furniture catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCatalog(); }, [loadCatalog]);
  useEffect(() => {
    let active = true;
    void accountApi.wishlist().then((items) => {
      if (active) setSaved(new Set(items.map((item) => item.variantId)));
    }).catch(() => {
      // The catalog remains browsable without a customer session.
    }).finally(() => { if (active) setWishlistLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selected = params.get("category");
    if (selected) setCategory(selected);
    setNewOnly(params.get("new") === "true");
  }, []);

  async function toggleWish(variantId: string) {
    if (pending.current || wishlistLoading) return;
    pending.current = true;
    setWishPending(variantId);
    setWishFeedback(null);
    const remove = saved.has(variantId);
    try {
      if (remove) await accountApi.removeWish(variantId);
      else await accountApi.saveWish(variantId);
      setSaved((previous) => {
        const next = new Set(previous);
        if (remove) next.delete(variantId);
        else next.add(variantId);
        return next;
      });
    } catch (reason) {
      const signIn = reason instanceof AccountApiError && reason.status === 401;
      setWishFeedback({
        message: signIn ? "Sign in to save furniture to your wishlist." : "Couldn’t update your wishlist. Try again.",
        signIn,
      });
    } finally {
      pending.current = false;
      setWishPending(null);
    }
  }

  const featuredCategories = useMemo(() => {
    const ordered = categoryOrder.map((slug) => categories.find((item) => item.slug === slug)).filter((item): item is Category => Boolean(item));
    return ordered.length ? ordered : categories.slice(0, 4);
  }, [categories]);

  const visibleProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      if (category !== "all" && product.category?.slug !== category) return false;
      if (availableOnly && !inStock(product)) return false;
      if (newOnly && !product.isNewArrival) return false;
      if (priceRange !== "all" && product.isPriceOnRequest) return false;
      const price = priceOf(product);
      if (priceRange === "under-25000" && price >= 25000) return false;
      if (priceRange === "25000-50000" && (price < 25000 || price > 50000)) return false;
      if (priceRange === "over-50000" && price <= 50000) return false;
      return true;
    });
    filtered = [...filtered];
    if (sort === "price-low") filtered.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === "price-high") filtered.sort((a, b) => priceOf(b) - priceOf(a));
    else if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "newest") filtered.sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));
    else filtered.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isBestSeller) - Number(a.isBestSeller));
    return filtered;
  }, [products, category, availableOnly, newOnly, priceRange, sort]);

  function selectCategory(slug: string) {
    setCategory(slug);
    setFilterParam("category", slug === "all" ? undefined : slug);
  }

  function selectNewOnly(enabled: boolean) {
    setNewOnly(enabled);
    setFilterParam("new", enabled ? "true" : undefined);
  }

  function setFilterParam(key: string, value?: string) {
    const url = new URL(window.location.href);
    if (value === undefined) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <main className="min-h-screen bg-white text-[#252522]">
      <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-3 text-[10px] text-[#777]"><a href="/" className="hover:text-[#f15a22]">Home</a><span className="px-1.5">›</span><span className="text-[#333]">Furniture</span></nav>
        <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f15a22]">Made for the way you live</p><h1 className="mt-1 text-[24px] font-semibold tracking-[-0.035em] sm:text-[28px]">Shop Furniture</h1></div>
          <p className="max-w-sm text-[11px] text-[#777]">Thoughtful pieces for every room, made to feel at home.</p>
        </header>

        <section aria-label="Shop by category" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {featuredCategories.map((item) => <button key={item.id} type="button" onClick={() => selectCategory(item.slug)} aria-pressed={category === item.slug} className={`group min-w-0 cursor-pointer border text-left transition ${category === item.slug ? "border-[#f15a22]" : "border-[#e8e7e3] hover:border-[#b8b4ac]"}`}>
            <div className="relative aspect-[1.62] overflow-hidden bg-[#efeee9]"><img src={item.logo || categoryFallbackImages[item.slug] || "/assets/hero/quality-living-room.webp"} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /></div>
            <span className="flex h-8 items-center justify-between px-2.5 text-[10px] font-medium sm:text-[11px]">{displayCategoryName(item)}<span aria-hidden="true" className="text-[#777]">›</span></span>
          </button>)}
        </section>

        <section aria-label="Product filters" className="mb-3 flex flex-wrap items-center gap-2 border-y border-[#eceae6] py-2">
          <button type="button" aria-pressed={newOnly} onClick={() => selectNewOnly(!newOnly)} className={`h-8 cursor-pointer border px-3 text-[10px] ${newOnly ? "border-[#292929] bg-[#292929] text-white" : "border-[#e5e3de] hover:border-[#aaa69f]"}`}>New</button>
          <button type="button" aria-pressed={availableOnly} onClick={() => setAvailableOnly(!availableOnly)} className={`h-8 cursor-pointer border px-3 text-[10px] ${availableOnly ? "border-[#292929] bg-[#292929] text-white" : "border-[#e5e3de] hover:border-[#aaa69f]"}`}>Available</button>
          <select aria-label="Filter by category" value={category} onChange={(event) => selectCategory(event.target.value)} className="h-8 min-w-[130px] cursor-pointer border border-[#e5e3de] bg-white px-2 text-[10px] outline-none focus:border-[#aaa69f]"><option value="all">Category</option>{categories.map((item) => <option key={item.id} value={item.slug}>{displayCategoryName(item)}</option>)}</select>
          <select aria-label="Filter by price" value={priceRange} onChange={(event) => setPriceRange(event.target.value)} className="h-8 min-w-[115px] cursor-pointer border border-[#e5e3de] bg-white px-2 text-[10px] outline-none focus:border-[#aaa69f]"><option value="all">Price range</option><option value="under-25000">Under ৳25,000</option><option value="25000-50000">৳25,000–৳50,000</option><option value="over-50000">Over ৳50,000</option></select>
          <span className="ml-auto text-[10px] text-[#777]">{loading ? "Loading products…" : `${visibleProducts.length} ${visibleProducts.length === 1 ? "item" : "items"}`}</span>
          <label className="flex h-8 items-center gap-1.5 text-[10px] text-[#555]">Sort by <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)} className="h-8 cursor-pointer bg-white text-[10px] font-medium outline-none"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label>
        </section>

        {error ? <div className="border border-[#ead9d2] bg-[#fffaf8] px-5 py-12 text-center"><p className="text-sm font-medium">We couldn’t load the furniture catalog.</p><p className="mt-1 text-xs text-[#777]">{error}</p><button type="button" onClick={() => void loadCatalog()} className="mt-4 cursor-pointer bg-[#f15a22] px-4 py-2 text-xs font-semibold text-white">Try again</button></div> : loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-square bg-[#f1f0ed]"/><div className="mt-3 h-3 w-2/3 bg-[#f1f0ed]"/><div className="mt-2 h-3 w-1/2 bg-[#f1f0ed]"/></div>)}</div> : visibleProducts.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {visibleProducts.map((product) => {
            const variant = defaultVariant(product);
            return <ProductCard
              key={product.id}
              product={product}
              saved={!!variant && saved.has(variant.id)}
              saving={wishlistLoading || wishPending !== null}
              onSave={variant ? () => void toggleWish(variant.id) : undefined}
              onView={() => setQuickView(product)}
            />;
          })}
        </div> : <div className="border border-[#e8e7e3] py-16 text-center"><h2 className="text-sm font-semibold">No furniture matches these filters.</h2><p className="mt-1 text-xs text-[#777]">Try another category or price range.</p><button type="button" onClick={() => { selectCategory("all"); selectNewOnly(false); setAvailableOnly(false); setPriceRange("all"); }} className="mt-4 cursor-pointer text-xs font-semibold text-[#f15a22] underline underline-offset-4">Clear filters</button></div>}
      </div>
      {wishFeedback && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-[90] flex flex-wrap items-center justify-between gap-3 border border-[#e6dfd6] bg-white px-4 py-3 text-sm shadow-lg sm:left-auto sm:right-6 sm:max-w-sm">
          <span>{wishFeedback.message}{wishFeedback.signIn && (
            <Link className="ml-2 font-semibold text-[#a93917] underline" href="/account/wishlist">Sign in</Link>
          )}</span>
          <button type="button" aria-label="Dismiss wishlist message" className="cursor-pointer px-2 text-lg" onClick={() => setWishFeedback(null)}>×</button>
        </div>
      )}
      {quickView && <ProductQuickView product={quickView} onClose={() => setQuickView(null)} onAdd={(variant) => {
        addItem(variant.id, 1, purchaseLimit(quickView, variant));
        setQuickView(null);
      }} />}
    </main>
  );
}

function ProductCard({ product, saved, saving, onSave, onView }: {
  product: Product;
  saved: boolean;
  saving: boolean;
  onSave?: () => void;
  onView: () => void;
}) {
  const variant = defaultVariant(product);
  const price = priceOf(product);
  const available = inStock(product);
  const finishCount = new Set((product.variants ?? []).flatMap((item) => (item.variantOptions ?? []).map((option) => option.displayValue).filter((value): value is string => Boolean(value)))).size;
  const rating = Number(product.avgRating);

  return <article className="group min-w-0 border border-[#e7e6e2] bg-white transition hover:border-[#ccc8c0]">
    <div className="relative aspect-square overflow-hidden bg-[#f3f1ed]">
      <Link href={`/products/${product.slug}`} prefetch={false} aria-label={`View ${product.name}`} className="block h-full w-full"><img src={imageForProduct(product, variant)} alt={variantImage(variant)?.alt ?? product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" loading="lazy" /></Link>
      {onSave && (
        <button type="button" onClick={onSave} disabled={saving} aria-pressed={saved}
          aria-label={`Save ${product.name} to wishlist`}
          className={`absolute right-2.5 top-2.5 grid size-9 cursor-pointer place-items-center rounded-full bg-white text-[#272522] shadow-sm disabled:opacity-70 ${saved ? "text-[#b8431e]" : ""}`}>
          <HomePageHeartIcon className={`size-[18px] ${saved ? "fill-current" : ""}`} />
        </button>
      )}
      {(product.isNewArrival || product.isBestSeller) && <span className="absolute left-2.5 top-2.5 bg-white/95 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-[#333]">{product.isNewArrival ? "New arrival" : "Bestseller"}</span>}
      {!available && <span className="absolute bottom-2.5 left-2.5 bg-[#292929]/90 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-white">Out of stock</span>}
    </div>
    <div className="p-2.5 sm:p-3">
      <p className="truncate text-[8px] uppercase tracking-[0.12em] text-[#888]">{product.category?.name ?? "Furniture"}</p>
      <h2 className="mt-1 min-h-9 text-[11px] font-semibold leading-[1.35] text-[#292929] sm:text-[12px]"><Link href={`/products/${product.slug}`} prefetch={false} className="line-clamp-2 hover:text-[#d94b17]">{product.name}</Link></h2>
      {rating > 0 ? <p className="mt-1 flex items-center gap-1 text-[9px]"><span className="text-[#ef8b00]">★</span><strong>{rating.toFixed(1)}</strong><span className="text-[#888]">({product.totalReviews ?? 0})</span></p> : <p className="mt-1 text-[9px] text-[#888]">{finishCount > 1 ? `${finishCount} finishes` : available ? "Ready to order" : "Currently unavailable"}</p>}
      <div className="mt-2 flex items-end justify-between gap-2 border-t border-[#eeedea] pt-2.5">
        <div><p className="text-[13px] font-bold leading-5 sm:text-[14px]">{product.isPriceOnRequest ? "Price on request" : product.variants?.length ? money(price) : "Price on request"}</p>{product.variants?.length && finishCount > 1 && <p className="text-[8px] text-[#888]">{finishCount} finishes</p>}</div>
        <button type="button" onClick={onView} className="shrink-0 cursor-pointer bg-[#f15a22] px-2.5 py-2 text-[9px] font-semibold text-white transition hover:bg-[#d94b17] sm:px-3" aria-label={`Quick view ${product.name}`}>Quick view</button>
      </div>
    </div>
  </article>;
}

function ProductQuickView({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (variant: ProductVariant) => void }) {
  const [variantId, setVariantId] = useState(defaultVariant(product)?.id);
  const [error, setError] = useState("");
  const variant = product.variants?.find((item) => item.id === variantId);
  const available = purchaseLimit(product, variant) > 0;
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`} className="relative grid max-h-[90vh] w-full max-w-[760px] overflow-auto bg-white shadow-2xl md:grid-cols-2">
      <button type="button" onClick={onClose} aria-label="Close quick view" className="absolute right-3 top-2 z-10 size-9 cursor-pointer bg-white/90 text-2xl leading-none text-[#555] hover:text-black">×</button>
      <div className="aspect-square bg-[#f3f1ed] md:aspect-auto md:min-h-[420px]"><img src={imageForProduct(product, variant)} alt={product.name} className="h-full w-full object-cover" /></div>
      <div className="flex flex-col p-5 sm:p-7">
        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#f15a22]">{product.category?.name ?? "Nestt Furniture"}</p>
        <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.025em]">{product.name}</h2>
        {product.description && <p className="mt-3 text-[13px] leading-6 text-[#6f6d68]">{product.description}</p>}
        {!!product.variants?.length && <label className="mt-5 grid gap-2 text-xs font-medium">Finish
          <select value={variantId} onChange={(event) => { setVariantId(event.target.value); setError(""); }} className="min-h-10 border border-[#e7e5e0] px-2.5">
            {product.variants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>}
        <div className="mt-auto pt-7">
          <p className="text-[20px] font-bold">{product.isPriceOnRequest || !variant ? "Price on request" : money(Number(variant.price))}</p>
          <button type="button" onClick={() => {
            if (!variant) return;
            try { onAdd(variant); }
            catch (error) { setError(error instanceof Error ? error.message : "Could not add this item to your cart."); }
          }} disabled={!available} className="mt-4 h-11 w-full cursor-pointer bg-[#f15a22] text-[11px] font-semibold text-white hover:bg-[#d94b17] disabled:cursor-not-allowed disabled:bg-[#bcb9b3]">Add to cart</button>
          {error && <p role="alert" className="mt-2 text-xs text-[#a04433]">{error}</p>}
          <Link href={`/products/${product.slug}`} className="mt-3 block text-center text-xs underline">View product details</Link>
        </div>
      </div>
    </section>
  </div>;
}
