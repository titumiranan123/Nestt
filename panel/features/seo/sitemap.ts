import type { SeoMetadata } from "./types";

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function buildSitemapXml(records: readonly SeoMetadata[]): string {
  const candidates = records.flatMap((record) => {
    if (!record.canonicalUrl || record.metaRobots?.toLowerCase().includes("noindex")) return [];
    try {
      const url = new URL(record.canonicalUrl);
      return [{ record, url }];
    } catch {
      return [];
    }
  });
  const origin = candidates[0]?.url.origin;
  const pages = candidates.filter(({ url }) => url.origin === origin);
  const entries = pages.map(({ record, url }) => {
    const date = record.updatedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    const home = record.pageName === "home";
    return `  <url>\n    <loc>${escapeXml(url.toString())}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>${home ? "daily" : "weekly"}</changefreq>\n    <priority>${home ? "1.0" : "0.8"}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
}
