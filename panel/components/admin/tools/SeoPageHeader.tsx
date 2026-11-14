import Link from "next/link";
import { ArrowUpRight, Bot, FileSearch, Globe2, LayoutDashboard } from "lucide-react";

const sections = [
  { label: "Overview", href: "/admin/seo", icon: LayoutDashboard },
  { label: "Page metadata", href: "/admin/seo/page-seo", icon: FileSearch },
  { label: "Robots.txt", href: "/admin/seo/robots", icon: Bot },
  { label: "Sitemap.xml", href: "/admin/seo/sitemap", icon: Globe2 },
] as const;

export function SeoPageHeader({ title, description, active }: { title: string; description: string; active?: string }) {
  return (
    <header className="mb-6 border-b border-gray-200 bg-white">
      <div className="pb-5 pt-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">SEO &amp; discovery</p>
        <div className="mt-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-[28px]">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">{description}</p>
          </div>
          {active === "overview" ? (
            <Link href="/admin/seo/page-seo" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand hover:text-brand-dark sm:self-auto">
              Edit page metadata <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
      <nav aria-label="SEO tools" className="-mb-px flex gap-1 overflow-x-auto">
        {sections.map(({ label, href, icon: Icon }) => {
          const selected = active === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${selected ? "border-brand text-brand" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"}`}
            >
              <Icon size={16} aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
