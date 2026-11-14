import { Bot, FileSearch, Globe2 } from "lucide-react";

export function SeoOverviewCards({ metadataCount, robotsReady, sitemapReady, loading }: { metadataCount: number; robotsReady: boolean; sitemapReady: boolean; loading: boolean }) {
  const cards = [
    { title: "Page metadata", value: String(metadataCount), caption: "Live storefront pages", detail: "Title, descriptions, canonical URLs", icon: FileSearch },
    { title: "Crawler access", value: robotsReady ? "Ready" : "Missing", caption: "robots.txt", detail: "Control how search bots crawl pages", icon: Bot },
    { title: "Sitemap", value: sitemapReady ? "Ready" : "Missing", caption: "sitemap.xml", detail: "Help search engines discover URLs", icon: Globe2 },
  ];
  return <section aria-label="SEO status" className="grid gap-0 border-y border-gray-200 sm:grid-cols-3">{cards.map(({ title, value, caption, detail, icon: Icon }, index) => <article key={title} className={`flex min-h-32 items-start gap-4 bg-white px-4 py-5 sm:px-5 ${index ? "border-t border-gray-200 sm:border-l sm:border-t-0" : ""}`}><span className="grid size-9 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-600"><Icon size={17}/></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{title}</p><div className="mt-1 flex items-baseline gap-2"><p className="text-2xl font-bold tracking-tight text-gray-950">{loading ? "…" : value}</p><span className="text-xs font-semibold text-gray-600">{caption}</span></div><p className="mt-1 text-xs text-gray-500">{detail}</p></div></article>)}</section>;
}
