export function SitemapEditorPanel({ content, onChange }: { content: string; onChange: (value: string) => void }) {
  const urlCount = (content.match(/<loc>[^<]+<\/loc>/g) ?? []).length;
  return <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
      <div><h2 className="text-sm font-bold text-gray-900">XML document</h2><p className="mt-0.5 text-xs text-gray-500">One canonical URL per &lt;url&gt; entry.</p></div>
      <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[11px] font-semibold text-gray-600">sitemap.xml</span>
    </div>
    <textarea aria-label="Sitemap XML content" spellCheck={false} rows={20} placeholder="Sitemap content is loaded from the database. Generate it from saved page canonicals when needed." className="min-h-[460px] w-full resize-y border-0 bg-white px-4 py-4 font-mono text-[13px] leading-6 text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary/25 sm:px-5" value={content} onChange={(event) => onChange(event.target.value)}/>
    <div className="flex justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500 sm:px-5"><span>XML · UTF-8</span><span>{urlCount} URLs · {content.length} characters</span></div>
  </section>;
}
