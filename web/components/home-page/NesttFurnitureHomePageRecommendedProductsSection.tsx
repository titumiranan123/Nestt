import Image from "next/image";
import { recommendedHomePageProducts } from "./nestt-furniture-home-page-content";
import { HomePageHeartIcon, HomePageStarIcon } from "./nestt-furniture-home-page-icons";

function ProductViewBadge({ kind }: { kind: "3D" | "AR" }) {
  return (
    <span className={`flex h-[22px] w-[47px] items-center justify-center gap-1 text-[11px] font-medium leading-none text-white ${kind === "3D" ? "bg-[#f15a22]" : "bg-[#171717]"}`}>
      {kind === "3D" ? (
        <svg aria-hidden="true" className="size-[13px]" viewBox="0 0 16 16" fill="none">
          <path d="M2.5 5.5c1.3-1 3.2-1.6 5.5-1.6s4.2.6 5.5 1.6M3.5 8c1.2.8 2.7 1.2 4.5 1.2S11.3 8.8 12.5 8M8 9.2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m6.5 11 1.5 1.5L9.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="size-[13px]" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="4.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 3.8c1.3 1 2 2.4 2 4.2s-.7 3.2-2 4.2M8 3.8C6.7 4.8 6 6.2 6 8s.7 3.2 2 4.2M3.8 8h8.4M2 5V3.5C2 2.7 2.7 2 3.5 2H5m6 0h1.5c.8 0 1.5.7 1.5 1.5V5M2 11v1.5c0 .8.7 1.5 1.5 1.5H5m6 0h1.5c.8 0 1.5-.7 1.5-1.5V11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      )}
      {kind}
    </span>
  );
}

export function NesttFurnitureHomePageRecommendedProductsSection() {
  return (
    <section className="bg-white py-12" id="recommended">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase leading-[1.5] tracking-[0.22em] text-[#f15a22]">✦ &nbsp; Curated for your space</p>
            <h2 className="mt-2 text-[40px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#1b1b1b]">Recommended for You</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous products" className="flex size-9 cursor-pointer items-center justify-center border border-[#d9d9d9] text-2xl leading-none">‹</button>
            <button type="button" aria-label="Next products" className="flex size-9 cursor-pointer items-center justify-center border border-[#d9d9d9] text-2xl leading-none">›</button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {recommendedHomePageProducts.map((product) => (
            <article className="group min-w-0 border border-[#e2e4e7] bg-white p-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.035)]" key={product.name}>
              <div className="relative aspect-[4/5] overflow-hidden bg-[#efeee9]">
                <Image className="object-cover" src={product.image} alt={product.name} fill sizes="(max-width: 767px) calc(100vw - 80px), (max-width: 1023px) 46vw, 24vw" />
                <div className="absolute left-[11px] top-[11px] flex flex-col gap-[2px]">
                  <ProductViewBadge kind="3D" />
                  <ProductViewBadge kind="AR" />
                </div>
                <button className="absolute right-[11px] top-[11px] flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-[#242424] shadow-[0_2px_6px_rgba(0,0,0,0.1)]" type="button" aria-label={`Save ${product.name} to wishlist`}>
                  <HomePageHeartIcon className="size-[19px]" />
                </button>
                <span className="absolute bottom-[18px] left-3 bg-white px-[9px] py-[4px] text-[11px] font-medium leading-[13px] text-[#222]">{product.badge}</span>
              </div>

              <div className="pt-[15px]">
                <h3 className="text-[15px] font-bold leading-[20px] text-[#202020]">{product.name}</h3>
                <div className="mt-[7px] flex items-center gap-[7px] leading-[18px]">
                  <HomePageStarIcon className="size-[15px] text-[#f28a00]" />
                  <strong className="text-[13px] font-semibold text-[#232323]">4.9</strong>
                  <span className="text-[12px] text-[#777]">({product.reviewCount} reviews)</span>
                </div>
                <div className="mt-[12px] flex items-center justify-between gap-3 border-t border-[#e2e4e7] pt-[13px]">
                  <div className="min-w-0">
                    <p className="text-[18px] font-bold leading-[24px] text-[#202020]">{product.price}</p>
                    <p className="mt-[2px] text-[11px] leading-[16px] text-[#777]">{product.detail}</p>
                  </div>
                  <div className="flex shrink-0 gap-[7px]" aria-label="Available colors: dark walnut and natural oak">
                    <span className="size-[16px] rounded-full bg-[#3c271e]" />
                    <span className="size-[16px] rounded-full bg-[#b99a74]" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
