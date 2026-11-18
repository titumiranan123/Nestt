import Link from "next/link";
import { money } from "@/lib/account/data";
import { catalogImageUrl, defaultVariant, variantImage } from "@/lib/catalog";
import { loadProductCollection } from "@/lib/public-products";

const grid = "grid gap-4 md:grid-cols-3";

export async function NesttFurnitureHomePageFreshArrivalsSection() {
  const products = await loadProductCollection("new-arrivals");
  if (!products?.length) return null;

  return (
    <section className="bg-white px-6 pb-12 pt-10" id="fresh-arrivals" aria-labelledby="fresh-arrivals-title">
      <div className="mx-auto max-w-[1392px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 id="fresh-arrivals-title" className="text-[36px] font-semibold leading-tight tracking-[-0.04em] text-[#1b1b1b]">
            Fresh Arrivals
          </h2>
          <Link href="/products?new=true" className="text-sm font-semibold text-[#a63d1a] underline underline-offset-4">
            View all arrivals
          </Link>
        </div>
        <div className={grid}>
          {products.map((product) => {
            const variant = defaultVariant(product);
            const image = catalogImageUrl(variantImage(variant)?.url);
            const price = Number(variant?.price);

            return <Link key={product.id} href={`/products/${encodeURIComponent(product.slug)}`} prefetch={false}
              className="group block min-w-0 border border-[#e4e4e4] p-3 hover:border-[#b8ada5]">
              <div className="relative aspect-[1.55] overflow-hidden bg-[#efeee9]">
                {image && <img src={image} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />}
                <span className="absolute left-3 top-3 bg-[#a63d1a] px-2 py-1 text-xs font-semibold text-white">New arrival</span>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 pt-3">
                <div>
                  {product.category && <p className="text-xs text-[#666]">{product.category.name}</p>}
                  <h3 className="mt-1 text-sm font-semibold leading-5 text-[#222]">{product.name}</h3>
                </div>
                <p className="text-sm font-semibold text-[#222]">
                  {product.isPriceOnRequest ? "Price on request" : Number.isFinite(price) ? money(price) : "Price unavailable"}
                </p>
              </div>
            </Link>;
          })}
        </div>
      </div>
    </section>
  );
}
