import { siteFont } from "@/lib/fonts";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchasePanel } from "./ProductPurchasePanel";
import { productDetailsProduct } from "./product-details-data";

export function ProductDetailsPage() {
  return (
    <div className={`${siteFont.className} min-h-screen bg-white text-[#222]`}>
      <main className="mx-auto max-w-[1440px] px-5 pb-14 sm:px-6 md:pr-2 lg:px-8">
        <section className="grid gap-7 md:grid-cols-[minmax(0,1.78fr)_minmax(250px,0.98fr)] md:gap-7 lg:gap-10">
          <ProductGallery image={productDetailsProduct.image} productName={productDetailsProduct.name} />
          <ProductPurchasePanel />
        </section>
      </main>
    </div>
  );
}
