import Link from "next/link";
import { Bot, FileSearch, Globe2 } from "lucide-react";

const sections = [
  { label: "Page SEO", href: "/admin/seo/page-seo", icon: FileSearch },
  { label: "Robot Config", href: "/admin/seo/robots", icon: Bot },
  { label: "Sitemap Config", href: "/admin/seo/sitemap", icon: Globe2 },
] as const;

export function SeoPageHeader({ title, description, active }: { title: string; description: string; active: (typeof sections)[number]["href"] }) {
  return (
    <header className="mb-6 border-b border-gray-200 bg-white">
      <div className="pb-5 pt-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">SEO &amp; discovery</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-[28px]">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">{description}</p>
      </div>
      <nav aria-label="SEO tools" className="-mb-px flex gap-1 overflow-x-auto">
        {sections.map(({ label, href, icon: Icon }) => {
          const selected = active === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${selected ? "border-secondary text-secondary" : "border-transparent text-gray-500 hover:border-secondary/40 hover:text-secondary"}`}
            >
              <Icon size={16} aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
