import type { SeoMetadata } from "@/features/seo/types";

const fieldClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-secondary focus:ring-2 focus:ring-secondary/15";
const textareaClass = "w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-secondary focus:ring-2 focus:ring-secondary/15";

type SeoPageDraft = Pick<
  SeoMetadata,
  | "pageName"
  | "metaTitle"
  | "metaDescription"
  | "metaKeywords"
  | "canonicalUrl"
  | "metaRobots"
  | "twitterCardType"
>;

type SeoPageFieldsProps = {
  draft: SeoPageDraft;
  pageNames: string[];
  onChange: (field: keyof SeoPageDraft, value: string) => void;
  onPageName: (pageName: string) => void;
};

export function SeoPageFields({ draft, pageNames, onChange, onPageName }: SeoPageFieldsProps) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 border-b border-gray-200 pb-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800" htmlFor="seo-page">Page</label>
          <select id="seo-page" className={fieldClass} value={draft.pageName} onChange={(event) => onPageName(event.target.value)}>
            {pageNames.map((name) => <option key={name} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800" htmlFor="seo-robots">Indexing</label>
          <select id="seo-robots" className={fieldClass} value={draft.metaRobots ?? "index, follow"} onChange={(event) => onChange("metaRobots", event.target.value)}>
            {["index, follow", "noindex, nofollow", "index, nofollow", "noindex, follow"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-500">Choose whether search engines may index this page and follow its links.</p>
        </div>
      </section>

      <section>
        <label className="mb-1.5 block text-sm font-semibold text-gray-800" htmlFor="seo-title">Meta title <span className="text-secondary">*</span></label>
        <input id="seo-title" required maxLength={60} className={fieldClass} value={draft.metaTitle} onChange={(event) => onChange("metaTitle", event.target.value)} placeholder="Enter a page title (up to 60 characters)" />
        <p className="mt-1 flex justify-between text-xs text-gray-500"><span>Search results usually display around 50–60 characters.</span><span>{draft.metaTitle.length}/60</span></p>
      </section>

      <section>
        <label className="mb-1.5 block text-sm font-semibold text-gray-800" htmlFor="seo-description">Meta description <span className="text-secondary">*</span></label>
        <textarea id="seo-description" required maxLength={200} rows={4} className={textareaClass} value={draft.metaDescription} onChange={(event) => onChange("metaDescription", event.target.value)} placeholder="Write a clear summary of this page for search results" />
        <p className="mt-1 flex justify-between text-xs text-gray-500"><span>Keep it concise; search engines may truncate longer descriptions.</span><span>{draft.metaDescription.length}/200</span></p>
      </section>

      <section className="grid grid-cols-1 gap-4 border-b border-gray-200 pb-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800" htmlFor="seo-keywords">Keywords</label>
          <input id="seo-keywords" className={fieldClass} value={draft.metaKeywords ?? ""} onChange={(event) => onChange("metaKeywords", event.target.value)} placeholder="Optional, comma-separated" />
          <p className="mt-1 text-xs text-gray-500">Optional. Focus first on useful page content and titles.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800" htmlFor="seo-canonical">Canonical URL</label>
          <input id="seo-canonical" type="url" className={fieldClass} value={draft.canonicalUrl ?? ""} onChange={(event) => onChange("canonicalUrl", event.target.value)} placeholder="https://your-store.com/page" />
        </div>
      </section>

      <section className="grid max-w-xl gap-1">
        <label className="text-sm font-semibold text-gray-800" htmlFor="seo-twitter">Social preview type</label>
        <select id="seo-twitter" className={fieldClass} value={draft.twitterCardType ?? "summary_large_image"} onChange={(event) => onChange("twitterCardType", event.target.value)}>
          {["summary", "summary_large_image", "app", "player"].map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
        </select>
      </section>
    </>
  );
}
