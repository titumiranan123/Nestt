"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useSaveSeoMetadata, useSeoMetadata } from "@/features/seo/hooks";
import type { SeoMetadata } from "@/features/seo/types";
import { SeoPageHeader } from "@/components/admin/tools/SeoPageHeader";
import { SeoPageFields } from "@/components/admin/tools/SeoPageFields";
import { SeoSubmitButton } from "@/components/admin/tools/SeoSubmitButton";
import { SeoSchemaEditor } from "@/components/admin/tools/SeoSchemaEditor";
import { SeoRequestError } from "@/components/admin/tools/SeoRequestError";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { confirmAdminAction } from "@/lib/admin-swal";
import { can } from "@/lib/rbac/can";

const storefrontPages = ["home", "products"];

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
  const { data: session } = useSession();
  const metadataQuery = useSeoMetadata();
  const saveMutation = useSaveSeoMetadata();
  const [pageName, setPageName] = useState("home");
  const [drafts, setDrafts] = useState<Partial<Record<string, SeoDraft>>>({});
  const pageNames = [...new Set([...storefrontPages, ...(metadataQuery.data?.map((record) => record.pageName) ?? [])])];
  const saved = metadataQuery.data?.find((record) => record.pageName === pageName);
  const defaultDraft = saved ? toDraft(saved) : emptyDraft(pageName);
  const current = drafts[pageName] ?? defaultDraft;
  const canEdit = can("website:update", session?.user?.permissions);
  const canSave = canEdit && !metadataQuery.isError && Boolean(metadataQuery.data) && !saveMutation.isPending;

  const update = <K extends keyof SeoDraft>(key: K, value: SeoDraft[K]) => {
    setDrafts((all) => ({ ...all, [pageName]: { ...(all[pageName] ?? defaultDraft), [key]: value } }));
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    if (current.metaRobots !== defaultDraft.metaRobots && !await confirmAdminAction(
      "Publish indexing change?",
      `The crawler directive for ${pageName} will be set to ${current.metaRobots}.`,
    )) return;

    const input = {
      metaTitle: current.metaTitle,
      metaDescription: current.metaDescription,
      metaKeywords: current.metaKeywords || null,
      canonicalUrl: current.canonicalUrl || null,
      metaRobots: current.metaRobots || null,
      twitterCardType: current.twitterCardType || null,
      schema: current.schema || null,
    };
    saveMutation.mutate({ pageName, input, exists: Boolean(saved) }, {
      onSuccess: () => setDrafts((all) => all[pageName] === current ? { ...all, [pageName]: undefined } : all),
    });
  };

  if (metadataQuery.isPending) return <AdminLoadingSkeleton kind="editor" label="Loading SEO metadata" />;

  return <div className="-mx-3 -my-5 min-h-full animate-fade-up bg-white px-3 py-5 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">
    <SeoPageHeader active="/admin/seo/page-seo" title="Page metadata" description="Manage search titles, descriptions, canonical URLs, social previews, and structured data for each storefront page."/>
    <SeoRequestError error={metadataQuery.error} onRetry={() => void metadataQuery.refetch()}/>
    {!metadataQuery.isError && !saved && <p className="mb-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{canEdit ? "Save the form to create SEO metadata for this page." : "This page has no saved SEO metadata yet."}</p>}
    <form onSubmit={save} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <SeoPageFields draft={current} pageNames={pageNames} onPageName={setPageName} onChange={(field, value) => update(field, value)}/>
      <SeoSchemaEditor value={current.schema} onChange={(value) => update("schema", value)}/>
      <SeoSubmitButton disabled={!canSave}>{saveMutation.isPending ? "Saving…" : "Save SEO Metadata"}</SeoSubmitButton>
    </form>
  </div>;
}
