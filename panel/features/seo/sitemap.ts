import type { SeoMetadata } from "./types";

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function buildSitemapXml(records: readonly SeoMetadata[]): string {
  const candidates = records.flatMap((record) => {
    if (!record.canonicalUrl) return [];
    try {
      const url = new URL(record.canonicalUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      url.hash = "";
      return [{ record, url, indexable: !/\bnoindex\b/i.test(record.metaRobots ?? "") }];
    } catch {
      return [];
    }
  });
  const origin = (candidates.find(({ record }) => record.pageName === "home") ?? candidates.find(({ indexable }) => indexable))?.url.origin;
  const seen = new Set<string>();
  const pages = candidates.filter(({ url, indexable }) => {
    if (url.origin !== origin || !indexable || seen.has(url.href)) return false;
    seen.add(url.href);
    return true;
  });
  if (!pages.length) return "";
  const entries = pages.map(({ record, url }) => {
    const date = record.updatedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    const home = record.pageName === "home";
    return `  <url>\n    <loc>${escapeXml(url.toString())}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>${home ? "daily" : "weekly"}</changefreq>\n    <priority>${home ? "1.0" : "0.8"}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
}
