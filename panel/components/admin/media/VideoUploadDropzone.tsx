"use client";

import { useRef, useState } from "react";
import { FileVideo2, UploadCloud } from "lucide-react";
import { videoChunkSize } from "@/features/media/api";

export function VideoUploadDropzone({ file, onSelect, disabled }: { file: File | null; onSelect: (file: File) => void; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const acceptFile = (candidate?: File) => {
    if (!candidate || disabled) return;
    onSelect(candidate);
  };
  return <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
    <header className="flex items-center gap-3 border-b border-gray-100 p-5">
<span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
<FileVideo2 size={19} />
</span>
<div>
<h2 className="text-sm font-bold text-gray-900">Chunked upload</h2>
<p className="mt-0.5 text-xs text-gray-500">Choose an MP4 video from your device</p>
</div>
</header>
    <div className="p-5">
<input ref={inputRef} type="file" accept="video/mp4,.mp4" disabled={disabled} className="hidden" onChange={(event) => { acceptFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); }} className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-accent bg-orange-50" : "border-brand/25 bg-brand-soft/30"}`}>
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-white text-brand shadow-sm">
<UploadCloud size={22} />
</span>
<p className="mt-3 text-sm font-bold text-gray-900">{file?.name ?? "Drop your video here"}</p>
<p className="mt-1 text-xs text-gray-500">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · MP4` : "MP4 video files up to 100 MB"}</p>
<button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="mt-4 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-orange-700">Choose video</button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
<div className="rounded-lg bg-brand-soft/70 p-3">
<p className="text-[9px] font-bold uppercase tracking-wide text-brand">File size</p>
<p className="mt-1 text-sm font-bold text-brand-dark">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "—"}</p>
</div>
<div className="rounded-lg bg-orange-50 p-3">
<p className="text-[9px] font-bold uppercase tracking-wide text-accent">Total chunks</p>
<p className="mt-1 text-sm font-bold text-accent">{file ? Math.ceil(file.size / videoChunkSize) : "—"}</p>
</div>
<div className="rounded-lg bg-gray-50 p-3">
<p className="text-[9px] font-bold uppercase tracking-wide text-gray-500">Chunk size</p>
<p className="mt-1 text-sm font-bold text-gray-700">5 MB</p>
</div>
</div>
    </div>
  </section>;
}
