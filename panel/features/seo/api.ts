import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { CreateSeoMetadataInput, SeoContent, SeoMetadata, SeoMetadataInput } from "./types";

export const seoApi = {
  listMetadata: (signal: AbortSignal) => apiClient<SeoMetadata[]>(endpoints.seo.meta, { signal }),
  createMetadata: (input: CreateSeoMetadataInput) => apiClient<SeoMetadata>(endpoints.seo.meta, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }),
  updateMetadata: (pageName: string, input: SeoMetadataInput) => apiClient<SeoMetadata>(endpoints.seo.metaPage(pageName), {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }),
  robots: (signal: AbortSignal) => apiClient<SeoContent>(endpoints.seo.robots, { signal }),
  saveRobots: (content: string) => apiClient<SeoContent>(endpoints.seo.robots, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }),
  }),
  sitemap: (signal: AbortSignal) => apiClient<SeoContent>(endpoints.seo.sitemap, { signal }),
  saveSitemap: (content: string) => apiClient<SeoContent>(endpoints.seo.sitemap, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }),
  }),
};
