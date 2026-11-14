"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";

export function BulkImageDropzone({ onFiles }: { onFiles: (files: FileList | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const openPicker = () => inputRef.current?.click();
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    onFiles(event.dataTransfer.files);
  };
  return <div
    onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
    onDragOver={(event) => event.preventDefault()}
    onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
    onDrop={handleDrop}
    className={`rounded-2xl border-2 border-dashed p-7 text-center transition sm:p-10 ${dragging ? "border-accent bg-orange-50" : "border-brand/25 bg-brand-soft/30 hover:border-brand/45 hover:bg-brand-soft/50"}`}
  >
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(event) => { onFiles(event.target.files); event.currentTarget.value = ""; }} />
    <span className={`mx-auto grid size-14 place-items-center rounded-2xl ${dragging ? "bg-accent text-white" : "bg-white text-brand shadow-sm"}`}>
<UploadCloud size={25} />
</span>
    <h2 className="mt-4 text-lg font-bold tracking-tight text-gray-900">Drop images here or click to browse</h2>
    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">Add product photos in one batch. You can preview and remove individual files before preparing them.</p>
    <button type="button" onClick={openPicker} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-white shadow-sm hover:bg-orange-700">
<ImagePlus size={16} />Choose images</button>
    <p className="mt-4 text-[11px] font-medium text-gray-400">JPG, PNG, WEBP, or GIF · Up to 10 MB each · Local demo preview only</p>
  </div>;
}
