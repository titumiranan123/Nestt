"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useSeoFile, useSeoMetadata, useSaveSeoFile } from "@/features/seo/hooks";
import { buildSitemapXml } from "@/features/seo/sitemap";
import { SeoPageHeader } from "@/components/admin/tools/SeoPageHeader";
import { SeoRequestError } from "@/components/admin/tools/SeoRequestError";
import { SeoSubmitButton } from "@/components/admin/tools/SeoSubmitButton";
import { SitemapEditorPanel } from "@/components/admin/tools/SitemapEditorPanel";
import { SitemapHealthPanel } from "@/components/admin/tools/SitemapHealthPanel";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { can } from "@/lib/rbac/can";

export function SitemapEditor() {
  const { data: session } = useSession();
  const sitemapQuery = useSeoFile("sitemap");
  const metadataQuery = useSeoMetadata();
  const saveMutation = useSaveSeoFile("sitemap");
  const [draft, setDraft] = useState<{ content: string; generatedAt?: string } | null>(null);
  const content = draft?.content ?? sitemapQuery.data?.content ?? "";
  const updatedAt = draft?.generatedAt ?? sitemapQuery.data?.updatedAt;
  const updatedAtLabel = updatedAt ? new Date(updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not updated yet";
  const canGenerate = Boolean(metadataQuery.data) && !metadataQuery.isError;
  const canSave = can("website:update", session?.user?.permissions) && !sitemapQuery.isError && Boolean(sitemapQuery.data)
    && Boolean(content.trim()) && content.trim() !== sitemapQuery.data?.content.trim() && !saveMutation.isPending;

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || !await confirmAdminAction("Publish sitemap.xml?", "This XML will replace the storefront’s published sitemap.")) return;
    saveMutation.mutate(content, {
      onSuccess: () => setDraft((current) => current === draft ? null : current),
    });
  };
  const generate = () => {
    if (!canGenerate || !metadataQuery.data) return;
    const generated = buildSitemapXml(metadataQuery.data);
    if (!generated) {
      void showAdminNotice("No URLs to include", "Save an indexable page with an HTTP or HTTPS canonical URL before generating the sitemap.", "warning");
      return;
    }
    setDraft({ content: generated, generatedAt: new Date().toISOString() });
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "application/xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sitemap.xml";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const valid = content.includes("<urlset") && content.includes("<loc>") && content.includes("</urlset>");

  if (sitemapQuery.isPending) return <AdminLoadingSkeleton kind="editor" label="Loading sitemap data" />;

  return <div className="-mx-3 -my-5 min-h-full animate-fade-up bg-white px-3 py-5 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">
    <SeoPageHeader active="/admin/seo/sitemap" title="Sitemap.xml" description="Review and publish the URL index that helps search engines discover your storefront."/>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
      <p className="max-w-2xl text-sm leading-6 text-gray-600">Your sitemap is served at <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">/sitemap.xml</code>. Generate it from saved canonical page URLs, then review before publishing.</p>
      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600"><span className={`size-1.5 rounded-full ${valid ? "bg-emerald-500" : "bg-amber-500"}`}/>{valid ? "XML detected" : "Needs review"}</span>
    </div>
    <SeoRequestError error={sitemapQuery.error ?? metadataQuery.error} onRetry={() => {
      if (sitemapQuery.isError) void sitemapQuery.refetch();
      if (metadataQuery.isError) void metadataQuery.refetch();
    }}/>
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <SitemapEditorPanel content={content} onChange={(value) => setDraft((current) => ({ ...current, content: value }))}/>
      <SitemapHealthPanel valid={valid} updatedAtLabel={updatedAtLabel} canGenerate={canGenerate} onGenerate={generate} onDownload={download}/>
      <SeoSubmitButton sticky disabled={!canSave}>{saveMutation.isPending ? "Saving…" : "Save Sitemap XML"}</SeoSubmitButton>
    </form>
  </div>;
}
