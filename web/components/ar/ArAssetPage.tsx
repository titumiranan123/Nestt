import Link from "next/link";
import { ArModelViewer } from "@/components/ar/ArModelViewer";
import { ArPhoneQr } from "@/components/ar/ArPhoneQr";
import type { ArAsset } from "@/lib/ar-assets";

export function ArAssetPage({ asset, fromProduct = false }: { asset: ArAsset; fromProduct?: boolean }) {
  return (
    <div className="min-h-screen bg-white text-[#24231f]">
      <main className="mx-auto max-w-[1280px] px-5 pb-16 pt-8 sm:px-8 lg:px-12">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#77736c]">
          <Link href="/" className="hover:text-[#f15a22]">Home</Link><span aria-hidden="true">/</span>
          {fromProduct && <><Link href="/product-details" className="hover:text-[#f15a22]">Oslo recliner</Link><span aria-hidden="true">/</span></>}
          <Link href={fromProduct ? "/ar?from=product-details" : "/ar"} className="hover:text-[#f15a22]">AR room models</Link><span aria-hidden="true">/</span>
          <span className="text-[#25231f]">{asset.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:gap-12">
          <div className="min-w-0 overflow-hidden border border-[#e9e5de]">
            <ArModelViewer asset={asset} />
          </div>
          <div className="flex flex-col justify-center py-2 lg:py-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#a2513d]">{asset.category} · {asset.placement === "floor" ? "Sample AR model" : "Sample 3D preview"}</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">{asset.name}</h1>
            <p className="mt-4 text-sm leading-6 text-[#706c64]">{asset.description}</p>
            <p className="mt-3 text-[11px] text-[#706c64]">Model X × Y × Z: {asset.dimensionsMm.join(" × ")} mm</p>
            <div className="mt-7 space-y-3 border-y border-[#e9e6e0] py-5 text-xs leading-5 text-[#625e56]">
              <p><strong className="text-[#33312c]">3D preview:</strong> drag or swipe to rotate; pinch or scroll to zoom.</p>
              <p><strong className="text-[#33312c]">Placement:</strong> {asset.placement === "floor" ? "on a supported phone, choose “Place in your room” in the viewer." : "wall and ceiling placement is still being developed; rotate this sample in 3D."}</p>
              <p>This free sample model is not an exact Nestt product representation.</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={`nestt://ar?asset=${encodeURIComponent(asset.slug)}`} className="inline-flex min-h-12 items-center justify-center bg-[#f15a22] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#d74a15]">Open in Nestt app</a>
              {fromProduct && <Link href="/product-details" className="inline-flex min-h-12 items-center justify-center bg-[#f15a22] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#d74a15]">Back to Oslo product</Link>}
              <Link href={fromProduct ? "/ar?from=product-details" : "/ar"} className="inline-flex min-h-12 items-center justify-center border border-[#302d27] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-[#f8f6f2]">Explore other models</Link>
              <a href={asset.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center border border-[#302d27] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-[#f8f6f2]">View source</a>
            </div>
            <div className="mt-5 border border-[#e9e5de] bg-[#faf9f6] p-4 text-[11px] leading-5 text-[#625e56]">
              <p className="font-semibold text-[#24231f]">Continue with this model after installing</p>
              <p className="mt-1">Install Nestt AR, return to this page, then tap Open in Nestt app. You can also scan the same QR again. The app will open {asset.placement === "floor" ? `${asset.name} in camera AR` : `${asset.name} in its 3D preview`}.</p>
              <div className="mt-3 flex flex-wrap gap-4 font-semibold text-[#8a4b37]">
                {process.env.ANDROID_STORE_URL && <a href={process.env.ANDROID_STORE_URL} className="underline underline-offset-4">Install for Android</a>}
                {process.env.IOS_STORE_URL && <a href={process.env.IOS_STORE_URL} className="underline underline-offset-4">Install for iPhone</a>}
              </div>
              {!process.env.ANDROID_STORE_URL && !process.env.IOS_STORE_URL && <p className="mt-2 text-[#9d5b45]">App store links are not published yet.</p>}
            </div>
            <ArPhoneQr />
          </div>
        </section>
      </main>
    </div>
  );
}
