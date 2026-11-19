"use client";

import { Image, Star, Trash2 } from "lucide-react";

export type LocalImage = { id: string; file: File; preview: string; primary: boolean; status: "Ready" | "Uploaded" };

export function ImageQueue({ items, onPrimary, onRemove, disabled }: {
  items: LocalImage[];
  disabled: boolean;
  onPrimary: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
    <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
<div className="flex items-center gap-3">
<span className="grid size-9 place-items-center rounded-lg bg-orange-50 text-accent">
<Image size={17} />
</span>
<div>
<h2 className="text-sm font-bold text-gray-900">Image queue</h2>
<p className="mt-0.5 text-xs text-gray-500">Review previews and choose the lead image</p>
</div>
</div>
<span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">{items.length} files</span>
</header>
    {items.length ? <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-brand/25 hover:shadow-sm">
      <div className="relative aspect-[4/3] bg-gray-50">
<img src={item.preview} alt={item.file.name} className="size-full object-cover" />
<span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.status === "Uploaded" ? "bg-brand text-white" : "bg-white/95 text-gray-600"}`}>{item.status}</span>{item.primary && <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-white">
<Star size={11} fill="currentColor" />Primary</span>}</div>
      <div className="p-3">
<p title={item.file.name} className="truncate text-xs font-semibold text-gray-800">{item.file.name}</p>
<p className="mt-1 text-[10px] text-gray-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB · {item.file.type.split("/")[1]?.toUpperCase()}</p>
<div className="mt-3 flex items-center justify-between gap-2">
<button type="button" disabled={disabled} onClick={() => onPrimary(item.id)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${item.primary ? "bg-orange-50 text-accent" : "bg-brand-soft text-brand hover:bg-brand/15"}`}>
<Star size={12} />{item.primary ? "Lead image" : "Set as primary"}</button>
<button type="button" disabled={disabled} onClick={() => onRemove(item.id)} aria-label={`Remove ${item.file.name}`} className="grid size-8 place-items-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600">
<Trash2 size={15} />
</button>
</div>
</div>
    </article>)}</div> : <div className="px-4 py-14 text-center">
<span className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-soft text-brand">
<Image size={20} />
</span>
<p className="mt-3 text-sm font-semibold text-gray-800">No images selected yet</p>
<p className="mt-1 text-xs text-gray-500">Add a batch above and image previews will appear here.</p>
</div>}
  </section>;
}
