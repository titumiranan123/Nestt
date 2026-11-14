import Image from "next/image";
import { ProductIcon } from "./ProductDetailsIcons";
import { productCollectionItems } from "./product-details-data";

export function ProductCollectionSection() {
  return (
    <section className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-semibold">Other Items of This Collection</h2>
        <span aria-hidden="true" className="text-sm leading-none text-[#555]">−</span>
      </div>
      <div className="mt-2 grid gap-1.5">
        {productCollectionItems.map((item) => (
          <article key={item.name} className="flex min-h-[64px] items-center gap-2 bg-[#f8f8f8] p-1.5">
            <div className="relative size-[52px] shrink-0 bg-[#e8e7e4]">
              <Image src={item.image} alt={item.name} fill sizes="52px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[9px] font-semibold">{item.name}</h3>
              <p className="mt-0.5 text-[8px]"><span className="text-[11px] text-[#f39200]">★</span> 4.9 <span className="text-[#888]">({item.reviews})</span></p>
              <p className="mt-1 text-[10px] font-semibold">{item.price}</p>
            </div>
            <button type="button" aria-label={`Add ${item.name} to cart`} className="flex size-[30px] shrink-0 cursor-pointer items-center justify-center border border-[#ff7043] text-[#f15a22] hover:bg-[#fff1eb]">
              <ProductIcon kind="cart" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
