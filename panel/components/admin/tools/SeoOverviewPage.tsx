"use client";

import { useSeoFile, useSeoMetadata } from "@/features/seo/hooks";
import { SeoOverviewCards } from "@/components/admin/tools/SeoOverviewCards";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { SeoPageHeader } from "@/components/admin/tools/SeoPageHeader";
import { SeoToolCards } from "@/components/admin/tools/SeoToolCards";

export function SeoOverviewPage() {
  const metadata = useSeoMetadata();
  const robots = useSeoFile("robots");
  const sitemap = useSeoFile("sitemap");
  const loading = metadata.isPending || robots.isPending || sitemap.isPending;
  if (loading) return <AdminLoadingSkeleton kind="cards" label="Loading search visibility data" />;
  return <div className="-mx-3 -my-5 min-h-full animate-fade-up bg-white px-3 py-5 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">
    <SeoPageHeader active="/admin/seo" title="Search visibility" description="Keep page metadata, crawler rules, and sitemap content organized in one place."/>
    <SeoOverviewCards metadataCount={metadata.data?.length ?? 0} robotsReady={Boolean(robots.data?.content)} sitemapReady={Boolean(sitemap.data?.content)} loading={loading}/>
    <SeoToolCards/>
  </div>;
}
