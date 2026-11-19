"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RotateCcw, Video } from "lucide-react";
import { VideoPreviewPanel } from "@/components/admin/media/VideoPreviewPanel";
import { VideoUploadDropzone } from "@/components/admin/media/VideoUploadDropzone";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { videoChunkSize, videoMaxSize } from "@/features/media/api";
import { useUploadVideo } from "@/features/media/hooks";

export function VideoUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const upload = useUploadVideo();
  const uploading = upload.isPending;
  const totalChunks = file ? Math.ceil(file.size / videoChunkSize) : 0;
  useEffect(() => {
    if (!file) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const selectVideo = (selected: File) => {
    if (selected.type !== "video/mp4" || selected.size < 12 || selected.size > videoMaxSize) {
      void showAdminNotice("Invalid video", "Choose an MP4 video up to 100 MB.", "warning");
      return;
    }
    setFile(selected);
    setUploadId(crypto.randomUUID());
    setPublishedUrl("");
    setUploadedChunks(0);
    upload.reset();
  };

  const uploadVideo = () => {
    if (!file || uploading || publishedUrl) return;
    setUploadedChunks(0);
    upload.mutate({ id: uploadId, file, onProgress: setUploadedChunks }, {
      onSuccess: ({ path }) => setPublishedUrl(new URL(`/api/bff${path}`, window.location.origin).href),
    });
  };
  const resetVideo = async () => {
    const confirmed = await confirmAdminAction("Reset video selection?", "This clears the current selection. Published videos remain available.");
    if (!confirmed) return;
    setFile(null);
    setUploadId("");
    setPublishedUrl("");
    setUploadedChunks(0);
    upload.reset();
  };

  return <main className="space-y-5 p-4 sm:p-6 lg:p-7">
    <header className="flex flex-col justify-between gap-4 rounded-2xl border border-brand/10 bg-gradient-to-r from-brand-soft/70 via-white to-orange-50/70 p-5 sm:flex-row sm:items-center sm:p-6"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white"><Video size={20} /></span><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Media library</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Video Upload Studio</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Preview an MP4 and upload it to the media library.</p></div></div><Link href="/admin/bulk-image-upload" className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-brand/15 bg-white px-4 text-sm font-semibold text-brand hover:bg-brand-soft"><ArrowLeft size={15} />Bulk image upload</Link></header>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,.92fr)]"><div className="space-y-4"><VideoUploadDropzone file={file} onSelect={selectVideo} disabled={uploading} />
      <section className="rounded-2xl border border-brand/10 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-gray-900">Upload workflow</p><p className="mt-1 text-xs leading-5 text-gray-500">Select a video, review the preview, then upload it to get a shareable link.</p></div><span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-[11px] font-bold sm:self-auto ${publishedUrl ? "bg-brand-soft text-brand" : "bg-orange-50 text-accent"}`}>{publishedUrl ? <CheckCircle2 size={13} /> : <span className="size-1.5 rounded-full bg-current" />}{publishedUrl ? "Uploaded" : uploading ? `${uploadedChunks} / ${totalChunks} chunks` : file ? "Ready to upload" : "Waiting for video"}</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={uploadVideo} disabled={!file || uploading || !!publishedUrl} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><Video size={15} />{uploading ? "Uploading…" : "Upload MP4"}</button><button onClick={resetVideo} disabled={!file || uploading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand/15 bg-white px-4 text-sm font-semibold text-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw size={15} />Reset</button></div></section>
    </div><VideoPreviewPanel file={file} previewUrl={publishedUrl || previewUrl} published={!!publishedUrl} /></div>
  </main>;
}
