import Link from "next/link";
import { money } from "@/lib/account/data";
import { catalogImageUrl, defaultVariant, variantImage } from "@/lib/catalog";
import { loadProductCollection } from "@/lib/public-products";
import { HomePageStarIcon } from "./nestt-furniture-home-page-icons";

const columns = "grid grid-cols-2 gap-3";
const browseLink = "text-sm font-semibold text-[#a63d1a] underline underline-offset-4";

export async function NesttFurnitureHomePageRecommendedProductsSection() {
  const products = await loadProductCollection("recommended");
  if (!products?.length) return null;

  return (
    <section className="bg-white py-12" id="recommended" aria-labelledby="recommended-title">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 id="recommended-title" className="text-[32px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#1b1b1b] sm:text-[40px]">
            Recommended for You
          </h2>
          <Link className={browseLink} href="/products">View all furniture</Link>
        </div>
        <div className={`${columns} ${products.length > 4 ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-4"}`}>
          {products.map((product) => {
            const variant = defaultVariant(product);
            const image = variantImage(variant);
            const imageUrl = catalogImageUrl(image?.url);
            const price = Number(variant?.price);
            const rating = Number(product.avgRating);
            const reviewCount = product.totalReviews ?? 0;

            return <Link key={product.id} href={`/products/${encodeURIComponent(product.slug)}`} prefetch={false}
              className="group flex min-w-0 flex-col border border-[#e2e4e7] bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] hover:border-[#b8ada5] sm:p-3.5">
              <div className="aspect-[4/5] overflow-hidden bg-[#efeee9]">
                {imageUrl && <img className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  src={imageUrl} alt="" loading="lazy" />}
              </div>
              <div className="flex flex-1 flex-col pt-3">
                {product.category && <p className="text-xs text-[#666]">{product.category.name}</p>}
                <h3 className="mt-1 text-sm font-semibold leading-5 text-[#202020]">{product.name}</h3>
                {rating > 0 && reviewCount > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-[#666]">
                  <HomePageStarIcon className="size-3.5 text-[#b76500]" />
                  <strong className="text-[#232323]">{rating.toFixed(1)}</strong>
                  <span>({reviewCount})</span>
                </p>}
                <p className="mt-auto pt-3 text-base font-semibold text-[#202020]">
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
