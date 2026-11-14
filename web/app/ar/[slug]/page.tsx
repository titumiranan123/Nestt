import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArAssetPage } from "@/components/ar/ArAssetPage";
import { arAssets, getArAsset } from "@/lib/ar-assets";

export function generateStaticParams() {
  return arAssets.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const asset = getArAsset(slug);
  if (!asset) return { title: "AR model not found | Nestt" };
  return {
    title: `${asset.name} in AR | Nestt`,
    description: `${asset.description} Try the sample model in 3D or AR.`,
  };
}

export default function ArAssetRoute({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }> }) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#faf9f6] text-sm text-[#706c64]">Loading room model…</div>}>
      <ArAssetContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ArAssetContent({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }> }) {
  const { slug } = await params;
  const { from } = await searchParams;
  const asset = getArAsset(slug);
  if (!asset) notFound();
  return <ArAssetPage asset={asset} fromProduct={from === "product-details"} />;
}
