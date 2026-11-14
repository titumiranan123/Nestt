import Link from "next/link";
import { ArrowRight, Bot, FileSearch, Globe2 } from "lucide-react";

export function SeoToolCards() {
  const tools = [
    { title: "Page SEO", path: "/admin/seo/page-seo", description: "Edit titles, descriptions, canonical URLs, social previews, and structured data for every live storefront page.", icon: FileSearch, label: "Live storefront pages", action: "Open metadata editor" },
    { title: "Robots.txt", path: "/admin/seo/robots", description: "Manage crawler directives, allow or disallow paths, and keep sitemap references visible.", icon: Bot, label: "Crawler configuration", action: "Edit crawler rules" },
    { title: "Sitemap.xml", path: "/admin/seo/sitemap", description: "Review, regenerate, and publish the XML URL index used by search engines.", icon: Globe2, label: "XML discovery", action: "Open sitemap editor" },
  ];
  return <section aria-label="SEO tools" className="grid gap-3 md:grid-cols-3">{tools.map(({ title, path, description, icon: Icon, label, action }) => <Link key={path} href={path} className="group flex min-h-52 flex-col border border-gray-200 bg-white p-4 no-underline transition-colors hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg border border-gray-200 text-gray-700"><Icon size={17}/></span><ArrowRight size={17} className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-brand"/></div><h2 className="mt-4 text-base font-bold tracking-tight text-gray-950">{title}</h2><p className="mt-1 flex-1 text-sm leading-6 text-gray-600">{description}</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-200 pt-3"><span className="text-[11px] font-medium text-gray-500">{label}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-brand">{action}<ArrowRight size={13}/></span></div></Link>)}</section>;
}
