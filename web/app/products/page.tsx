import type { Metadata } from "next";
import { ProductsListingPage } from "@/components/products/ProductsListingPage";
import { SeoStructuredData } from "@/components/SeoStructuredData";
import { getPublicSeoMetadata, seoRobots, seoTwitterCard } from "@/lib/seo";

const defaultMetadata: Metadata = {
  title: "Shop Furniture | Nestt",
  description: "Shop sofas, chairs, tables, beds, storage and thoughtful furniture for everyday living.",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublicSeoMetadata("products");
  if (!seo) return defaultMetadata;

  const { metaTitle: title, metaDescription: description, canonicalUrl } = seo;
  return {
    title,
    description,
    keywords: seo.metaKeywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    alternates: canonicalUrl ? { canonical: canonicalUrl } : null,
    robots: seoRobots(seo.metaRobots),
    openGraph: { title, description, type: "website", url: canonicalUrl ?? undefined, siteName: "Nestt" },
    twitter: { card: seoTwitterCard(seo.twitterCardType), title, description },
  };
}

export default async function ProductsRoute() {
  const seo = await getPublicSeoMetadata("products");
  return <><SeoStructuredData content={seo?.schema ?? null}/><ProductsListingPage /></>;
}
