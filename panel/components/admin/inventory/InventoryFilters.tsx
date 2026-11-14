"use client";

import { RotateCcw, Search } from "lucide-react";

export function InventoryFilters({ search, status, onSearch, onStatus, onReset }: {
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <section className="mb-4 grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm xs:p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
      <label className="flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-brand transition focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10" aria-label="Search inventory">
        <Search size={17} className="shrink-0" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search by SKU, product, category, or brand" className="w-full border-0 bg-transparent py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400" />
      </label>
      <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-500">
      <span className="sr-only">Stock status</span>
      <select value={status} onChange={(event) => onStatus(event.target.value)} aria-label="Filter stock status" className="h-10 w-full rounded-xl border-0 bg-white px-1 text-sm text-gray-700 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">
        <option value="ALL">All stock status</option>
        <option value="IN_STOCK">In stock</option>
        <option value="LOW_STOCK">Low stock</option>
        <option value="OUT_OF_STOCK">Out of stock</option>
        <option value="BACKORDER">Backorder</option>
      </select>
      </label>
      <button type="button" onClick={onReset} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-accent/20 bg-orange-50/60 px-4 text-sm font-semibold text-accent transition hover:bg-orange-50">
        <RotateCcw size={15} />Reset filters
      </button>
    </section>
  );
}
