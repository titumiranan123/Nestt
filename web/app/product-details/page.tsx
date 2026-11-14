import type { Metadata } from "next";
import { Navbar } from "@/components/navigation/Navbar";
import { ProductDetailsPage } from "@/components/product-details/ProductDetailsPage";
import { SeoStructuredData } from "@/components/SeoStructuredData";
import { getPublicSeoMetadata, seoRobots, seoTwitterCard } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublicSeoMetadata("product-details");
  const title = seo?.metaTitle ?? "Aero Bentwood Premium Exclusive Sofa | Nestt";
  const description = seo?.metaDescription ?? "Discover the Aero Bentwood Premium Exclusive Sofa, featuring a steam-bent teak frame and textured boucle cushioning.";
  return {
    title,
    description,
    keywords: seo?.metaKeywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    robots: seoRobots(seo?.metaRobots ?? null),
    openGraph: { title, description, type: "website", url: seo?.canonicalUrl ?? undefined, siteName: "Nestt" },
    twitter: { card: seoTwitterCard(seo?.twitterCardType ?? null), title, description },
  };
}

export default async function ProductDetailRoute() {
  const seo = await getPublicSeoMetadata("product-details");
  return (
    <>
      <SeoStructuredData content={seo?.schema ?? null}/>
      <Navbar variant="product" />
      <ProductDetailsPage />
    </>
  );
}
