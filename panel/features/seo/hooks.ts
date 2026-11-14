"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { seoApi } from "./api";
import { seoKeys } from "./keys";
import type { SeoMetadataInput } from "./types";

export function useSeoMetadata() {
  return useQuery({ queryKey: seoKeys.metadata(), queryFn: seoApi.listMetadata });
}

export function useSeoFile(name: "robots" | "sitemap") {
  return useQuery({ queryKey: seoKeys.file(name), queryFn: name === "robots" ? seoApi.robots : seoApi.sitemap });
}

export function useSaveSeoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageName, input, exists }: { pageName: string; input: SeoMetadataInput; exists: boolean }) =>
      exists ? seoApi.updateMetadata(pageName, input) : seoApi.createMetadata({ ...input, pageName }),
    meta: { successMessage: "Page SEO metadata saved." },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: seoKeys.metadata() }),
  });
}

export function useSaveSeoFile(name: "robots" | "sitemap") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => name === "robots" ? seoApi.saveRobots(content) : seoApi.saveSitemap(content),
    meta: { successMessage: `${name === "robots" ? "Robots.txt" : "Sitemap.xml"} saved.` },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: seoKeys.file(name) }),
  });
}
