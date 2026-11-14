import { Filter, Search, X } from "lucide-react";

import type { CatalogRecord } from "@/lib/catalog-demo-data";

export default function CatalogFilters({
  kind,
  rows,
  search,
  status,
  category,
  brand,
  onSearch,
  onStatus,
  onCategory,
  onBrand,
  onReset,
}: {
  kind: "products" | "categories" | "attributes" | "brands";
  rows: CatalogRecord[];
  search: string;
  status: string;
  category: string;
  brand: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onCategory: (value: string) => void;
  onBrand: (value: string) => void;
  onReset: () => void;
}) {
  const categories = [...new Set(rows.map((row) => row.category).filter((value): value is string => Boolean(value)))];
  const brands = [...new Set(rows.map((row) => row.brand).filter((value): value is string => Boolean(value)))];
  const selectClass = "h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";
  return <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
    <div className="flex h-10 min-w-52 flex-1 sm:max-w-xl">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-l-lg border border-r-0 border-gray-200 px-3 text-gray-400 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10"><Search size={15}/><input className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400" value={search} onChange={(event) => onSearch(event.target.value)} placeholder={kind === "products" ? "Search product or SKU" : `Search ${kind}`} /></label>
      <button type="button" onClick={() => onSearch(search)} className="inline-flex shrink-0 items-center gap-1.5 rounded-r-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark"><Search size={14}/>Search</button>
    </div>
    <label className="relative"><Filter size={14} className="pointer-events-none absolute left-3 top-3 text-gray-400"/><select className={`${selectClass} pl-8 pr-8`} aria-label="Filter by status" value={status} onChange={(event) => onStatus(event.target.value)}><option>All status</option><option>Published</option><option>Draft</option></select></label>
    {kind === "products" && <><select className={selectClass} aria-label="Filter by category" value={category} onChange={(event) => onCategory(event.target.value)}><option>All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select className={selectClass} aria-label="Filter by brand" value={brand} onChange={(event) => onBrand(event.target.value)}><option>All brands</option>{brands.map((value) => <option key={value}>{value}</option>)}</select></>}
    <button onClick={onReset} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"><X size={14}/> Reset</button>
  </div>;
}
