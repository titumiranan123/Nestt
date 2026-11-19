"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { seoApi } from "./api";
import { seoKeys } from "./keys";
import type { SeoMetadata, SeoMetadataInput } from "./types";

export function useSeoMetadata() {
  return useQuery({ queryKey: seoKeys.metadata(), queryFn: ({ signal }) => seoApi.listMetadata(signal) });
}

export function useSeoFile(name: "robots" | "sitemap") {
  return useQuery({
    queryKey: seoKeys.file(name),
    queryFn: ({ signal }) => name === "robots" ? seoApi.robots(signal) : seoApi.sitemap(signal),
  });
}

export function useSaveSeoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageName, input, exists }: { pageName: string; input: SeoMetadataInput; exists: boolean }) =>
      exists ? seoApi.updateMetadata(pageName, input) : seoApi.createMetadata({ ...input, pageName }),
    meta: { successMessage: "Page SEO metadata saved." },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
        return queryClient.invalidateQueries({ queryKey: seoKeys.metadata() });
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<SeoMetadata[]>(seoKeys.metadata(), (current) => [
        ...(current ?? []).filter(({ pageName }) => pageName !== saved.pageName),
        saved,
      ].sort((left, right) => left.pageName.localeCompare(right.pageName)));
      return queryClient.invalidateQueries({ queryKey: seoKeys.metadata() });
    },
  });
}

export function useSaveSeoFile(name: "robots" | "sitemap") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => name === "robots" ? seoApi.saveRobots(content) : seoApi.saveSitemap(content),
    meta: { successMessage: `${name === "robots" ? "Robots.txt" : "Sitemap.xml"} saved.` },
    onSuccess: (saved) => {
      queryClient.setQueryData(seoKeys.file(name), saved);
      return queryClient.invalidateQueries({ queryKey: seoKeys.file(name) });
    },
  });
}
