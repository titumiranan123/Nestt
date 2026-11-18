"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSaveSeoMetadata, useSeoMetadata } from "@/features/seo/hooks";
import type { SeoMetadata } from "@/features/seo/types";
import { SeoPageHeader } from "@/components/admin/tools/SeoPageHeader";
import { SeoPageFields } from "@/components/admin/tools/SeoPageFields";
import { SeoSubmitButton } from "@/components/admin/tools/SeoSubmitButton";
import { SeoSchemaEditor } from "@/components/admin/tools/SeoSchemaEditor";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";

type SeoDraft = {
  pageName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  metaRobots: string;
  twitterCardType: string;
  schema: string;
};

const emptyDraft = (pageName: string): SeoDraft => ({
  pageName,
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  canonicalUrl: "",
  metaRobots: "index, follow",
  twitterCardType: "summary_large_image",
  schema: "",
});

function toDraft(record: SeoMetadata): SeoDraft {
  return {
    pageName: record.pageName,
    metaTitle: record.metaTitle,
    metaDescription: record.metaDescription,
    metaKeywords: record.metaKeywords ?? "",
    canonicalUrl: record.canonicalUrl ?? "",
    metaRobots: record.metaRobots ?? "index, follow",
    twitterCardType: record.twitterCardType ?? "summary_large_image",
    schema: record.schema ?? "",
  };
}

export function PageSeoEditor() {
  const metadataQuery = useSeoMetadata();
  const saveMutation = useSaveSeoMetadata();
  const [pageName, setPageName] = useState("home");
  const [pages, setPages] = useState<Record<string, SeoDraft>>({});
  const pageNames = metadataQuery.data?.map(({ pageName: name }) => name) ?? [];
  const current = pages[pageName] ?? emptyDraft(pageName);

  useEffect(() => {
    if (!metadataQuery.data) return;
    setPages(Object.fromEntries(metadataQuery.data.map((record) => [record.pageName, toDraft(record)])));
    if (!metadataQuery.data.some((record) => record.pageName === pageName) && metadataQuery.data[0]) {
      setPageName(metadataQuery.data[0].pageName);
    }
  }, [metadataQuery.data]);

  const update = <K extends keyof SeoDraft>(key: K, value: SeoDraft[K]) => {
    setPages((all) => ({ ...all, [pageName]: { ...current, [key]: value } }));
  };
  const selectPage = (nextPage: string) => {
    setPageName(nextPage);
    const record = metadataQuery.data?.find(({ pageName: name }) => name === nextPage);
    if (record) setPages((all) => ({ ...all, [nextPage]: toDraft(record) }));
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = {
      metaTitle: current.metaTitle,
      metaDescription: current.metaDescription,
      metaKeywords: current.metaKeywords || null,
      canonicalUrl: current.canonicalUrl || null,
      metaRobots: current.metaRobots || null,
      twitterCardType: current.twitterCardType || null,
      schema: current.schema || null,
    };
    saveMutation.mutate({ pageName, input, exists: metadataQuery.data?.some((record) => record.pageName === pageName) ?? false });
  };

  if (metadataQuery.isPending) return <AdminLoadingSkeleton kind="editor" label="Loading SEO metadata" />;

  return <div className="-mx-3 -my-5 min-h-full animate-fade-up bg-white px-3 py-5 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">
    <SeoPageHeader active="/admin/seo/page-seo" title="Page metadata" description="Manage search titles, descriptions, canonical URLs, social previews, and structured data for each storefront page."/>
    {metadataQuery.isError ? <p role="alert" className="mb-4 border-l-2 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-800">SEO metadata could not be loaded. Refresh the page to try again.</p> : null}
    {!pageNames.length && <p className="mb-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">No SEO pages are available yet. Add page metadata through the SEO API before editing.</p>}
    <form onSubmit={save} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <SeoPageFields draft={current} pageNames={pageNames} onPageName={selectPage} onChange={(field, value) => update(field, value)}/>
      <SeoSchemaEditor value={current.schema} onChange={(value) => update("schema", value)}/>
      <SeoSubmitButton disabled={!pageNames.length || saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save SEO Metadata"}</SeoSubmitButton>
    </form>
  </div>;
}
