import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { ArIcon } from "@/components/shared/ArIcon";
import { arAssets } from "@/lib/ar-assets";

const cardColors = ["bg-[#e6ded1]", "bg-[#d7ded6]", "bg-[#dedbd4]", "bg-[#e6ded8]", "bg-[#d7d6d0]"];

export function ArGalleryPage({ fromProduct = false }: { fromProduct?: boolean }) {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#24231f]">
      <Navbar variant="product" />
      <main className="mx-auto max-w-[1280px] px-5 pb-20 pt-10 sm:px-8 lg:px-12">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-[#77736c]">
          <Link href="/" className="hover:text-[#f15a22]">Home</Link>
          {fromProduct && <><span aria-hidden="true">/</span><Link href="/product-details" className="hover:text-[#f15a22]">Oslo recliner</Link></>}
          <span aria-hidden="true">/</span><span className="text-[#25231f]">AR room models</span>
        </nav>

        {fromProduct && <Link href="/product-details" className="mb-7 inline-flex min-h-10 items-center text-xs font-medium text-[#625e56] underline underline-offset-4 hover:text-[#f15a22]">← Back to Oslo product</Link>}

        <section className="max-w-3xl">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a2513d]"><ArIcon className="size-5" /> Nestt room preview</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">See room models in your space.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#706c64]">Rotate any model in 3D. Floor models can also be placed in your room on a supported phone.</p>
        </section>

        <Link href="/room-planner" className="mt-7 inline-flex min-h-12 items-center justify-center bg-[#f15a22] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#d74a15]">Open room designer ↗</Link>

        <aside className="mt-8 border-l-2 border-[#f15a22] bg-white px-5 py-4 text-xs leading-5 text-[#625e56]">
          These are free sample models for trying the AR experience. They are not exact Nestt product models; product-specific AR will be added when matching product assets are available.
        </aside>

        <section aria-labelledby="ar-models-heading" className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a2513d]">10 models to explore</p><h2 id="ar-models-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Living room collection</h2></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {arAssets.map((asset, index) => (
              <article key={asset.slug} className="group overflow-hidden border border-[#e9e5de] bg-white">
                <Link href={`/ar/${asset.slug}${fromProduct ? "?from=product-details" : ""}`} className="block focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#f15a22]">
                  <div className={`relative grid aspect-[1.25] place-items-center ${cardColors[index % cardColors.length]}`}>
                    <span className="absolute left-4 top-4 bg-white/90 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#5a554d]">{asset.placement === "floor" ? "3D · AR" : "3D preview"}</span>
                    <span className="font-serif text-[64px] font-semibold tracking-[-0.06em] text-black/15">{String(index + 1).padStart(2, "0")}</span>
                    <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white text-[#34312b] shadow-sm transition-transform group-hover:translate-x-1"><ArIcon className="size-5" /></span>
                  </div>
                  <div className="p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#a2513d]">{asset.category}</p>
                    <h3 className="mt-1 text-[15px] font-semibold">{asset.name}</h3>
                    <p className="mt-2 text-[11px] text-[#77736c]">3D-তে দেখুন <span aria-hidden="true">→</span></p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
