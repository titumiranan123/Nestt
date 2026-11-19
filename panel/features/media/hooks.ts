"use client";

import { useMutation } from "@tanstack/react-query";
import { mediaApi, type ImageUploadInput } from "./api";

type ImageBatch = {
  images: ImageUploadInput[];
  onUploaded: (id: string, path: string) => void;
};

type VideoUpload = {
  id: string;
  file: File;
  onProgress: (uploaded: number) => void;
};

export function useUploadImageBatch() {
  return useMutation({
    mutationFn: async ({ images, onUploaded }: ImageBatch) => {
      for (const image of images) {
        const upload = await mediaApi.uploadImage(image);
        onUploaded(image.id, upload.path);
      }
    },
    meta: { successMessage: "Image batch uploaded." },
  });
}

export function useUploadVideo() {
  return useMutation({
    mutationFn: ({ id, file, onProgress }: VideoUpload) => mediaApi.uploadVideo(id, file, onProgress),
    meta: { successMessage: "Video uploaded. The link is ready to share." },
  });
}
