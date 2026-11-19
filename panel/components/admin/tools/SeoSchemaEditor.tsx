const card = "overflow-hidden rounded-xl border border-gray-200 bg-white";

const textarea = "min-h-72 w-full resize-y border-0 bg-white px-3 py-3 font-mono text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary/20 sm:px-4";

export function SeoSchemaEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <section className={card}><div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-5"><h2 className="text-sm font-bold text-gray-900">Structured data <span className="font-mono font-medium text-gray-500">(JSON-LD)</span></h2><p className="mt-1 text-xs text-gray-500">Optional schema markup for supported rich search results.</p></div><textarea aria-label="Schema JSON-LD" spellCheck={false} rows={14} className={textarea} value={value} onChange={(event) => onChange(event.target.value)}/></section>;
}
