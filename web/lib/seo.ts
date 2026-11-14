import "server-only";
import { cacheLife } from "next/cache";

export type PublicSeoMetadata = {
  pageName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  metaRobots: string | null;
  schema: string | null;
  twitterCardType: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSeoMetadata(value: unknown): PublicSeoMetadata | null {
  if (!isRecord(value)) return null;
  if (typeof value.pageName !== "string" || typeof value.metaTitle !== "string" || typeof value.metaDescription !== "string") return null;
  let canonicalUrl: string | null = null;
  if (typeof value.canonicalUrl === "string") {
    try {
      const parsedUrl = new URL(value.canonicalUrl);
      if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") canonicalUrl = parsedUrl.toString();
    } catch {
      canonicalUrl = null;
    }
  }
  return {
    pageName: value.pageName,
    metaTitle: value.metaTitle,
    metaDescription: value.metaDescription,
    metaKeywords: typeof value.metaKeywords === "string" ? value.metaKeywords : null,
    canonicalUrl,
    metaRobots: typeof value.metaRobots === "string" ? value.metaRobots : null,
    schema: typeof value.schema === "string" ? value.schema : null,
    twitterCardType: typeof value.twitterCardType === "string" ? value.twitterCardType : null,
  };
}

export async function getPublicSeoMetadata(pageName: string): Promise<PublicSeoMetadata | null> {
  const backendUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backendUrl) return null;
  return getCachedPublicSeoMetadata(pageName, backendUrl);
}

async function getCachedPublicSeoMetadata(pageName: string, backendUrl: string): Promise<PublicSeoMetadata | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  try {
    const response = await fetch(`${backendUrl}/seo/meta/${encodeURIComponent(pageName)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    return parseSeoMetadata(await response.json());
  } catch {
    return null;
  }
}

export function seoRobots(value: string | null) {
  const directives = value?.toLowerCase() ?? "index, follow";
  return { index: !directives.includes("noindex"), follow: !directives.includes("nofollow") };
}

export function seoTwitterCard(value: string | null): "summary" | "summary_large_image" | "app" | "player" {
  if (value === "summary" || value === "app" || value === "player") return value;
  return "summary_large_image";
}
