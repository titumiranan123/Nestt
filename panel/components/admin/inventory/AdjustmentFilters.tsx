"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { AdjustmentType } from "@/lib/inventory-media-demo";

export function AdjustmentFilters({ query, type, onQuery, onType }: {
  query: string;
  type: string;
  onQuery: (value: string) => void;
  onType: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-[minmax(0,1fr)_190px]">
      <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-brand focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search SKU, product, or reason"
          className="w-full border-0 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
      </label>
      <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-gray-500">
        <SlidersHorizontal size={15} />
        <select
          value={type}
          onChange={(event) => onType(event.target.value)}
          className="w-full border-0 bg-transparent text-sm text-gray-700 outline-none"
        >
          <option value="ALL">All movement types</option>
          {(["PURCHASE", "SALE", "RETURN", "CORRECTION", "DAMAGE", "TRANSFER"] as AdjustmentType[]).map((entry) => (
            <option key={entry} value={entry}>{entry.charAt(0) + entry.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
