export function RobotsEditorPanel({ content, onChange }: { content: string; onChange: (value: string) => void }) {
  const lineCount = content ? content.split("\n").length : 0;
  return <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
      <div><h2 className="text-sm font-bold text-gray-900">Crawler rules</h2><p className="mt-0.5 text-xs text-gray-500">One directive per line. Blank lines and comments are allowed.</p></div>
      <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[11px] font-semibold text-gray-600">robots.txt</span>
    </div>
    <textarea aria-label="Robots.txt content" spellCheck={false} rows={18} placeholder="User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://your-store.com/sitemap.xml" className="min-h-[420px] w-full resize-y border-0 bg-white px-4 py-4 font-mono text-[13px] leading-6 text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary/25 sm:px-5" value={content} onChange={(event) => onChange(event.target.value)}/>
    <div className="flex justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500 sm:px-5"><span>Plain text · UTF-8</span><span>{lineCount} lines · {content.length} characters</span></div>
  </section>;
}
