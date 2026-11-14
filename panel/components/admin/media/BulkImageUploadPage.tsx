"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck, Images, RotateCcw } from "lucide-react";
import { BulkImageDropzone } from "@/components/admin/media/BulkImageDropzone";
import { ImageQueue, type LocalImage } from "@/components/admin/media/ImageQueue";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";

export function BulkImageUploadPage() {
  const [images, setImages] = useState<LocalImage[]>([]);
  const imageUrls = useRef(new Set<string>());
  useEffect(() => () => imageUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const accepted = Array.from(list).filter((file) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) && file.size <= 10 * 1024 * 1024);
    const skipped = list.length - accepted.length;
    const additions = accepted.map((file, index) => {
      const preview = URL.createObjectURL(file);
      imageUrls.current.add(preview);
      return { id: `${Date.now()}-${index}-${file.name}`, file, preview, primary: false, status: "Ready" as const };
    });
    setImages((current) => [...current, ...additions.map((image, index) => ({ ...image, primary: current.length === 0 && index === 0 }))]);
    if (skipped) void showAdminNotice("Some files were skipped", "Only image files up to 10 MB can be previewed.", "warning");
  };
  const setPrimary = (id: string) => setImages((current) => current.map((image) => ({ ...image, primary: image.id === id })));
  const removeImage = (id: string) => setImages((current) => {
    const removed = current.find((image) => image.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.preview);
      imageUrls.current.delete(removed.preview);
    }
    const remaining = current.filter((image) => image.id !== id);
    return removed?.primary && remaining.length ? remaining.map((image, index) => ({ ...image, primary: index === 0 })) : remaining;
  });
  const prepareBatch = () => {
    if (!images.length) return;
    setImages((current) => current.map((image) => ({ ...image, status: "Prepared" })));
    void showAdminNotice("Image batch prepared", "These local previews are marked ready. No files were sent to an API.", "success");
  };
  const clearBatch = async () => {
    const confirmed = await confirmAdminAction("Clear selected images?", "This removes the current local previews from the batch.");
    if (!confirmed) return;
    images.forEach((image) => {
      URL.revokeObjectURL(image.preview);
      imageUrls.current.delete(image.preview);
    });
    setImages([]);
  };

  return <main className="space-y-5 p-4 sm:p-6 lg:p-7">
    <header className="flex flex-col justify-between gap-4 rounded-2xl border border-brand/10 bg-gradient-to-r from-brand-soft/70 via-white to-orange-50/70 p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Media library</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Bulk Image Upload</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Select and organize multiple product images in one workspace.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand sm:self-auto"><Images size={14} />{images.length} selected</span></header>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(270px,.8fr)]"><div className="space-y-5"><BulkImageDropzone onFiles={addFiles} /><ImageQueue items={images} onPrimary={setPrimary} onRemove={removeImage} /></div>
      <aside className="h-fit rounded-2xl border border-line bg-white shadow-sm"><header className="border-b border-gray-100 p-5"><h2 className="text-sm font-bold text-gray-900">Batch details</h2><p className="mt-1 text-xs text-gray-500">Check the selection before preparing previews</p></header><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-brand-soft/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-brand">Images</p><p className="mt-1 text-xl font-bold text-brand-dark">{images.length}</p></div><div className="rounded-xl bg-orange-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-accent">Total size</p><p className="mt-1 text-xl font-bold text-accent">{(images.reduce((sum, item) => sum + item.file.size, 0) / 1024 / 1024).toFixed(1)} <small className="text-xs">MB</small></p></div></div>
        <div className="space-y-2 rounded-xl border border-gray-100 p-3 text-xs"><p className="font-bold text-gray-800">Accepted formats</p><div className="flex flex-wrap gap-1.5">{["JPG", "PNG", "WEBP", "GIF"].map((format) => <span key={format} className="rounded-md bg-brand-soft px-2 py-1 font-semibold text-brand">{format}</span>)}</div><p className="pt-1 text-gray-500">Maximum image size is 10 MB per file.</p></div>
        <div className="rounded-xl border border-accent/15 bg-orange-50/60 p-3 text-xs leading-5 text-gray-600">This media screen works with browser-local previews. It does not upload files or call a backend.</div>
        <button type="button" onClick={prepareBatch} disabled={!images.length} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckCheck size={16} />Prepare image batch</button><button type="button" onClick={clearBatch} disabled={!images.length} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-brand/15 text-sm font-semibold text-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw size={15} />Clear selection</button>
      </div></aside></div>
  </main>;
}
