"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSaveSeoFile, useSeoFile } from "@/features/seo/hooks";
import { RobotsEditorPanel } from "@/components/admin/tools/RobotsEditorPanel";
import { RobotsHealthPanel } from "@/components/admin/tools/RobotsHealthPanel";
import { SeoPageHeader } from "@/components/admin/tools/SeoPageHeader";
import { SeoSubmitButton } from "@/components/admin/tools/SeoSubmitButton";

export function RobotsEditor() {
  const query = useSeoFile("robots");
  const saveMutation = useSaveSeoFile("robots");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (query.data) setContent(query.data.content);
  }, [query.data]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(content);
  };
  const copy = async () => navigator.clipboard.writeText(content);

  if (query.isPending) return <div className="-mx-3 -my-5 min-h-full bg-white px-3 py-5 text-sm text-gray-500 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">Loading robots.txt…</div>;

  return <div className="-mx-3 -my-5 min-h-full animate-fade-up bg-white px-3 py-5 sm:-mx-5 sm:-my-6 sm:px-5 sm:py-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">
    <SeoPageHeader active="/admin/seo/robots" title="Robots.txt" description="Control which parts of the storefront search crawlers can access."/>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
      <p className="max-w-2xl text-sm leading-6 text-gray-600">Changes publish the crawler policy at <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">/robots.txt</code>. Keep important product and category pages crawlable.</p>
      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600"><span className="size-1.5 rounded-full bg-emerald-500"/> Editor ready</span>
    </div>
    {query.isError ? <p role="alert" className="mb-4 border-l-2 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-800">Robots rules could not be loaded. Refresh the page to try again.</p> : null}
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <RobotsEditorPanel content={content} onChange={setContent}/>
      <RobotsHealthPanel content={content} onCopy={() => void copy()}/>
      <SeoSubmitButton sticky disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save Robots.txt"}</SeoSubmitButton>
    </form>
  </div>;
}
