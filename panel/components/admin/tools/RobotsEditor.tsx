"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useSaveSeoFile, useSeoFile } from "@/features/seo/hooks";
import { RobotsEditorPanel } from "@/components/admin/tools/RobotsEditorPanel";
import { RobotsHealthPanel } from "@/components/admin/tools/RobotsHealthPanel";
import { SeoPageHeader } from "@/components/admin/tools/SeoPageHeader";
import { SeoRequestError } from "@/components/admin/tools/SeoRequestError";
import { SeoSubmitButton } from "@/components/admin/tools/SeoSubmitButton";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { can } from "@/lib/rbac/can";

export function RobotsEditor() {
  const { data: session } = useSession();
  const query = useSeoFile("robots");
  const saveMutation = useSaveSeoFile("robots");
  const [draft, setDraft] = useState<string | null>(null);
  const content = draft ?? query.data?.content ?? "";
  const canSave = can("website:update", session?.user?.permissions) && !query.isError && Boolean(query.data)
    && Boolean(content.trim()) && content.trim() !== query.data?.content.trim() && !saveMutation.isPending;

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || !await confirmAdminAction("Publish robots.txt?", "These rules will update the storefront’s crawler policy.")) return;
    saveMutation.mutate(content, {
      onSuccess: () => setDraft((current) => current === content ? null : current),
    });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      void showAdminNotice("Clipboard unavailable", "Select the crawler rules in the editor to copy them.", "warning");
    }
  };

  if (query.isPending) return <AdminLoadingSkeleton kind="editor" label="Loading robots.txt" />;

  return <div className="-mx-3 -my-5 min-h-full animate-fade-up bg-white px-3 py-5 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">
    <SeoPageHeader active="/admin/seo/robots" title="Robots.txt" description="Control which parts of the storefront search crawlers can access."/>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
      <p className="max-w-2xl text-sm leading-6 text-gray-600">Changes publish the crawler policy at <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">/robots.txt</code>. Keep important product and category pages crawlable.</p>
      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600"><span className={`size-1.5 rounded-full ${query.isError ? "bg-amber-500" : "bg-emerald-500"}`}/> {query.isError ? "Load failed" : "Editor ready"}</span>
    </div>
    <SeoRequestError error={query.error} onRetry={() => void query.refetch()}/>
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <RobotsEditorPanel content={content} onChange={setDraft}/>
      <RobotsHealthPanel content={content} onCopy={() => void copy()}/>
      <SeoSubmitButton sticky disabled={!canSave}>{saveMutation.isPending ? "Saving…" : "Save Robots.txt"}</SeoSubmitButton>
    </form>
  </div>;
}
