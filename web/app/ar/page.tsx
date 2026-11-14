import { Suspense } from "react";
import type { Metadata } from "next";
import { ArGalleryPage } from "@/components/ar/ArGalleryPage";

export const metadata: Metadata = {
  title: "Try AR Room Models | Nestt",
  description: "Explore free sample furniture and decor models in 3D and augmented reality.",
};

export default function ArPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#faf9f6] text-sm text-[#706c64]">Loading AR models…</div>}>
      <ArGalleryContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ArGalleryContent({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <ArGalleryPage fromProduct={from === "product-details"} />;
}
