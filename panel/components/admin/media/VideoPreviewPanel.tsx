"use client";

import { useState } from "react";
import { Check, Clipboard, ExternalLink, Film, Link2 } from "lucide-react";

export function VideoPreviewPanel({ file, previewUrl }: { file: File | null; previewUrl: string }) {
  const [copied, setCopied] = useState(false);
  const copyPreview = async () => {
    if (!previewUrl) return;
    try { await navigator.clipboard.writeText(previewUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); }
  };
  return <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
    <header className="flex items-center gap-3 border-b border-gray-100 p-5">
<span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-accent">
<Film size={18} />
</span>
<div>
<h2 className="text-sm font-bold text-gray-900">Preview and share</h2>
<p className="mt-0.5 text-xs text-gray-500">Review the local video before continuing</p>
</div>
</header>
    <div className="space-y-4 p-5">
<div className="aspect-video overflow-hidden rounded-xl bg-gray-950">{previewUrl ? <video src={previewUrl} controls className="size-full" /> : <div className="grid size-full place-items-center text-center text-white/70">
<div>
<Film size={28} className="mx-auto text-accent" />
<p className="mt-2 text-xs">Video preview will appear here</p>
</div>
</div>}</div>
      <div className="rounded-xl border border-brand/10 bg-brand-soft/40 p-3">
<div className="flex items-start gap-2">
<Link2 size={15} className="mt-0.5 shrink-0 text-brand" />
<div className="min-w-0 flex-1">
<p className="text-xs font-bold text-gray-800">Local preview URL</p>
<p className="mt-1 truncate text-[10px] text-gray-500">{previewUrl || "Choose an MP4 file to create a preview"}</p>
</div>
<button onClick={copyPreview} disabled={!previewUrl} aria-label="Copy local preview URL" className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-brand hover:bg-brand-soft disabled:opacity-40">{copied ? <Check size={14} /> : <Clipboard size={14} />}</button>
</div>
</div>
      <div className="rounded-xl border border-accent/15 bg-orange-50/60 p-3">
<p className="text-xs font-bold text-accent">Upload notes</p>
<ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-gray-600">
<li>• MP4 is required for this upload workflow.</li>
<li>• The video stays in this browser as a local preview.</li>
<li>• No chunk request or server upload is made in demo mode.</li>
</ul>
</div>
      {file && previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-accent">Open preview in new tab <ExternalLink size={13} />
</a>}
    </div>
  </section>;
}
