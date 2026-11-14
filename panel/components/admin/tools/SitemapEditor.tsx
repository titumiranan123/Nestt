"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSeoFile, useSeoMetadata, useSaveSeoFile } from "@/features/seo/hooks";
import { buildSitemapXml } from "@/features/seo/sitemap";
import { SeoPageHeader } from "@/components/admin/tools/SeoPageHeader";
import { SeoSubmitButton } from "@/components/admin/tools/SeoSubmitButton";
import { SitemapEditorPanel } from "@/components/admin/tools/SitemapEditorPanel";
import { SitemapHealthPanel } from "@/components/admin/tools/SitemapHealthPanel";

export function SitemapEditor() {
  const sitemapQuery = useSeoFile("sitemap");
  const metadataQuery = useSeoMetadata();
  const saveMutation = useSaveSeoFile("sitemap");
  const [content, setContent] = useState("");
  const [generatedAt, setGeneratedAt] = useState("Not generated yet");

  useEffect(() => {
    if (!sitemapQuery.data) return;
    setContent(sitemapQuery.data.content);
    setGeneratedAt(sitemapQuery.data.updatedAt
      ? new Date(sitemapQuery.data.updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      : "Not generated yet");
  }, [sitemapQuery.data]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(content);
  };
  const generate = () => {
    setContent(buildSitemapXml(metadataQuery.data ?? []));
    setGeneratedAt(new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
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

  if (sitemapQuery.isPending || metadataQuery.isPending) return <div className="-mx-3 -my-5 min-h-full bg-white px-3 py-5 text-sm text-gray-500 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">Loading sitemap data…</div>;

  return <div className="-mx-3 -my-5 min-h-full animate-fade-up bg-white px-3 py-5 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">
    <SeoPageHeader active="/admin/seo/sitemap" title="Sitemap.xml" description="Review and publish the URL index that helps search engines discover your storefront."/>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
      <p className="max-w-2xl text-sm leading-6 text-gray-600">Your sitemap is served at <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">/sitemap.xml</code>. Generate it from saved canonical page URLs, then review before publishing.</p>
      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600"><span className={`size-1.5 rounded-full ${valid ? "bg-emerald-500" : "bg-amber-500"}`}/>{valid ? "XML detected" : "Needs review"}</span>
    </div>
    {(sitemapQuery.isError || metadataQuery.isError) ? <p role="alert" className="mb-4 border-l-2 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-800">Sitemap data could not be loaded. Refresh the page to try again.</p> : null}
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <SitemapEditorPanel content={content} onChange={setContent}/>
      <SitemapHealthPanel valid={valid} generatedAt={generatedAt} onGenerate={generate} onDownload={download}/>
      <SeoSubmitButton sticky disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save Sitemap XML"}</SeoSubmitButton>
    </form>
  </div>;
}
