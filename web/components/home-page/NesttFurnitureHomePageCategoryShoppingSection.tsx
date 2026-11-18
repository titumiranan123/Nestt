import Link from "next/link";
import { catalogImageUrl } from "@/lib/catalog";
import { fetchPublicCategories } from "@/lib/public-categories";

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  isPopularCat: boolean;
  logo?: string | null;
};

const grid = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6";
const fallbackImage = "/assets/hero/quality-living-room.webp";

export async function NesttFurnitureHomePageCategoryShoppingSection() {
  let categories: PublicCategory[] = [];
  try {
    const response = await fetchPublicCategories();
    if (response?.ok) {
      const data: unknown = await response.json();
      if (Array.isArray(data)) categories = data.filter((category: PublicCategory) => category.isPopularCat === true);
    }
  } catch {
    return null;
  }
  if (!categories.length) return null;

  return (
    <section className="bg-[#f5f5f5] px-6 py-16" id="products">
      <div className="mx-auto max-w-[1392px]">
        <div className="mx-auto mb-10 flex max-w-[600px] flex-col items-center text-center">
          <p className="text-[12px] font-bold uppercase leading-[16px] tracking-[1.1px] text-[#f15a22]">Shop the collection</p>
          <h2 className="mt-2 text-[40px] font-semibold leading-[44px] tracking-[-0.035em] text-[#2c292a] max-[767px]:text-[32px]">Shop by Category</h2>
          <p className="mt-1 text-[20px] leading-[1.5] text-[#575757] max-[767px]:text-base">Explore furniture for every room, from everyday seating to thoughtful storage.</p>
        </div>
        <div className={grid}>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="group flex min-h-[173px] flex-col items-center border border-[#e5e5ea] bg-white px-4 py-[21px] text-center shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:border-[#b8ada5]"
            >
              <div className="size-20 shrink-0 overflow-hidden rounded-full bg-[#ece8df]">
                <img className="size-full object-cover" src={catalogImageUrl(category.logo) ?? fallbackImage} alt="" width={80} height={80} loading="lazy" />
              </div>
              <p className="mt-2 text-[14px] font-bold leading-5 text-[#191919]">{category.name}</p>
              <p className="text-[11px] leading-4 text-[#727272] group-hover:underline">Browse collection</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
