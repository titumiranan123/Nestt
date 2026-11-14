import Image from "next/image";
import { homePageCategoryLinks } from "./nestt-furniture-home-page-content";

export function NesttFurnitureHomePageCategoryShoppingSection() {
  return (
    <section className="bg-[#f5f5f5] px-6 py-16" id="products">
      <div className="mx-auto max-w-[1392px]">
        <div className="mx-auto mb-10 flex max-w-[600px] flex-col items-center text-center">
          <p className="text-[12px] font-bold uppercase leading-[16px] tracking-[1.1px] text-[#f15a22]">Browse Archetypes</p>
          <h2 className="mt-2 text-[40px] font-semibold leading-[44px] tracking-[-0.035em] text-[#2c292a] max-[767px]:text-[32px]">Shop by Category</h2>
          <p className="mt-1 text-[20px] leading-[1.5] text-[#575757] max-[767px]:text-base">Engineered precision, robotic joinery, and ergonomic craftsmanship for every living corner.</p>
        </div>
        <div className="grid grid-cols-6 gap-3 max-[1023px]:grid-cols-3 max-[639px]:grid-cols-2">
          {homePageCategoryLinks.map((category) => (
            <a className="flex min-h-[173px] flex-col items-center border border-[#e5e5ea] bg-white px-4 py-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]" href="#recommended" key={category.name}>
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-[#ece8df]">
                <Image className="object-cover" src={category.image} alt="" fill sizes="80px" />
              </div>
              <p className="mt-2 text-[14px] font-bold leading-5 text-[#191919]">{category.name}</p>
              <p className="text-[11px] leading-[16px] text-[#727272]">{category.count}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
