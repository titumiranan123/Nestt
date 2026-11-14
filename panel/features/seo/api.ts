import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { CreateSeoMetadataInput, SeoContent, SeoMetadata, SeoMetadataInput } from "./types";

export const seoApi = {
  listMetadata: () => apiClient<SeoMetadata[]>(endpoints.seo.meta),
  createMetadata: (input: CreateSeoMetadataInput) => apiClient<SeoMetadata>(endpoints.seo.meta, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }),
  updateMetadata: (pageName: string, input: SeoMetadataInput) => apiClient<SeoMetadata>(endpoints.seo.metaPage(pageName), {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }),
  robots: () => apiClient<SeoContent>(endpoints.seo.robots),
  saveRobots: (content: string) => apiClient<SeoContent>(endpoints.seo.robots, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }),
  }),
  sitemap: () => apiClient<SeoContent>(endpoints.seo.sitemap),
  saveSitemap: (content: string) => apiClient<SeoContent>(endpoints.seo.sitemap, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }),
  }),
};
