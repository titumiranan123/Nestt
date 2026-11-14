export type SeoMetadata = {
  id?: string;
  pageName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  metaRobots: string | null;
  schema: string | null;
  twitterCardType: string | null;
  updatedAt?: string;
};

export type SeoMetadataInput = Omit<SeoMetadata, "id" | "updatedAt" | "pageName">;
export type CreateSeoMetadataInput = SeoMetadataInput & { pageName: string };

export type SeoContent = { content: string; updatedAt: string | null };
