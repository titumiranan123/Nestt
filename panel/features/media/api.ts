import { apiClient } from "@/lib/api/client";

export const videoChunkSize = 5 * 1024 * 1024;
export const videoMaxSize = 100 * 1024 * 1024;

type UploadedMedia = { id: string; path: string };

export type ImageUploadInput = { id: string; file: File; primary: boolean; batchId: string; position: number };

export const mediaApi = {
  uploadImage({ id, file, primary, batchId, position }: ImageUploadInput) {
    const body = new FormData();
    body.set("id", id);
    body.set("batchId", batchId);
    body.set("name", file.name);
    body.set("position", String(position));
    body.set("primary", String(primary));
    body.set("file", file);
    return apiClient<UploadedMedia>("/admin/media/images", { method: "POST", body });
  },

  async uploadVideo(id: string, file: File, onProgress: (uploaded: number) => void) {
    await apiClient<{ id: string }>("/admin/media/videos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, name: file.name, size: file.size }),
    });
    for (let start = 0, index = 0; start < file.size; start += videoChunkSize, index += 1) {
      const body = new FormData();
      body.set("file", file.slice(start, start + videoChunkSize, "video/mp4"), "chunk.mp4");
      await apiClient<void>(`/admin/media/videos/${id}/chunks/${index}`, { method: "PUT", body });
      onProgress(index + 1);
    }
    return apiClient<UploadedMedia>(`/admin/media/videos/${id}/complete`, { method: "POST" });
  },
};
