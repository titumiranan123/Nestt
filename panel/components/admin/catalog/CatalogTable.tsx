"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BadgeCheck, Box, ChevronDown, ChevronRight, Edit3, Layers3, SlidersHorizontal, Trash2 } from "lucide-react";
import { EmptyRow } from "@/components/admin/catalog/EmptyRow";
import { PublishSwitch } from "@/components/admin/catalog/PublishSwitch";
import { StatusPill } from "@/components/admin/catalog/StatusPill";
import type { CatalogRecord } from "@/lib/catalog-demo-data";

type CatalogKind = "products" | "categories" | "attributes" | "brands";
type CatalogTableProps = {
  kind: CatalogKind;
  rows: CatalogRecord[];
  selected: string[];
  onToggleSelected: (id: string) => void;
  onToggleAll: () => void;
  onTogglePublished: (row: CatalogRecord) => void;
  onEdit: (row: CatalogRecord) => void;
  onDelete: (row: CatalogRecord) => void;
};

const money = (value = 0) => `৳${value.toLocaleString("en-BD")}`;
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString("en-GB") : "—";
const timeLabel = (value?: string) => value ? new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function CatalogTable(props: CatalogTableProps) {
  const { kind } = props;
  if (kind === "categories") return <CategoryTable {...props} />;
  if (kind === "brands") return <BrandTable {...props} />;
  if (kind === "attributes") return <AttributeTable {...props} />;
  return <ProductTable {...props} />;
}

function CategoryTable({ rows, onTogglePublished, onEdit, onDelete }: CatalogTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const childrenByParent = useMemo(() => {
    const grouped = new Map<string, CatalogRecord[]>();
    rows.forEach((row) => {
      if (!row.parent) return;
      grouped.set(row.parent, [...(grouped.get(row.parent) ?? []), row]);
    });
    return grouped;
  }, [rows]);
  const visibleRows = (category: CatalogRecord, number: string, depth = 0): ReactNode[] => {
    const children = childrenByParent.get(category.name) ?? [];
    const isExpanded = expanded[category.id] ?? false;
    return [
      <tr key={category.id} className={`${depth ? "bg-brand-soft/25" : "bg-white"} divide-x divide-gray-100 transition-colors hover:bg-orange-50/50`}>
        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-700">{number}</td>
        <td className="px-4 py-4 text-sm text-gray-700">
          <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 28}px` }}>
            {children.length ? <button type="button" aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.name}`} aria-expanded={isExpanded} onClick={() => setExpanded((current) => ({ ...current, [category.id]: !isExpanded }))} className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/15 text-brand transition hover:bg-brand-soft">{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button> : <span className="w-8 shrink-0 text-center text-gray-300">{depth ? "└" : ""}</span>}
            <span><strong className="block font-semibold text-gray-800">{category.name}</strong><small className="mt-0.5 block text-[11px] text-gray-400">{category.slug} · {category.id}</small></span>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700">{category.productCount ?? 0}</td>
        <td className="whitespace-nowrap px-4 py-4 text-center">{category.logo ? <img src={category.logo} alt={`${category.name} logo`} className="mx-auto size-9 rounded-md object-cover" /> : <span className="text-sm text-gray-400">—</span>}</td>
        <td className="whitespace-nowrap px-4 py-4">{category.isPopular ? <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-accent">Popular</span> : <span className="text-sm text-gray-400">—</span>}</td>
        <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-600"><span className="block">{dateLabel(category.createdAt)}</span><span className="mt-1 block text-gray-400">{timeLabel(category.createdAt)}</span></td>
        <td className="whitespace-nowrap px-4 py-4"><PublishSwitch name={category.name} checked={category.isPublished} onClick={() => onTogglePublished(category)} /></td>
        <td className="whitespace-nowrap px-4 py-4"><RowActions row={category} onEdit={onEdit} onDelete={onDelete} /></td>
      </tr>,
      ...(isExpanded ? children.flatMap((child, index) => visibleRows(child, `${number}.${index + 1}`, depth + 1)) : []),
    ];
  };
  const roots = rows.filter((row) => !row.parent || !rows.some((candidate) => candidate.name === row.parent));

  return <div className="overflow-x-auto"><table className="w-full min-w-[1080px] table-fixed divide-y divide-gray-100 text-left text-sm">
    <colgroup><col className="w-[7%]" /><col className="w-[26%]" /><col className="w-[10%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[13%]" /><col className="w-[11%]" /><col className="w-[15%]" /></colgroup>
    <thead className="border-b border-brand/10 bg-brand-soft/45 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600"><tr className="divide-x divide-gray-100">{["SL", "Category Name", "Products", "Logo", "Popular", "Created On", "Status", "Action"].map((heading) => <th key={heading} className="px-4 py-3.5 text-left">{heading}</th>)}</tr></thead>
    <tbody className="divide-y divide-gray-100 bg-white">{roots.flatMap((row, index) => visibleRows(row, String(index + 1)))}{!roots.length && <EmptyRow columns={8} kind="categories" />}</tbody>
  </table></div>;
}

function BrandTable({ rows, onTogglePublished, onEdit, onDelete }: CatalogTableProps) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[850px] divide-y divide-gray-100 text-left text-sm">
    <thead className="border-b border-brand/10 bg-brand-soft/45 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600"><tr className="divide-x divide-gray-100">{["SL", "Brand Name", "Logo", "Created On", "Publish", "Action"].map((heading) => <th key={heading} className="px-5 py-3.5">{heading}</th>)}</tr></thead>
    <tbody className="divide-y divide-gray-100 bg-white">{rows.map((brand, index) => <tr key={brand.id} className={`${index % 2 ? "bg-brand-soft/15" : "bg-white"} divide-x divide-gray-100 transition-colors hover:bg-orange-50/50`}>
      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-700">{index + 1}</td>
      <td className="whitespace-nowrap px-5 py-4"><strong className="block font-semibold text-gray-800">{brand.name}</strong><small className="mt-1 block text-xs text-gray-400">{brand.slug} · {brand.id}</small></td>
      <td className="px-5 py-4">{brand.logo ? <img src={brand.logo} alt={`${brand.name} logo`} className="h-9 w-16 rounded-md object-contain" /> : <span className="text-sm text-gray-400">—</span>}</td>
      <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-600"><span className="block">{dateLabel(brand.createdAt)}</span><span className="mt-1 block text-gray-400">{timeLabel(brand.createdAt)}</span></td>
      <td className="whitespace-nowrap px-5 py-4"><PublishSwitch name={brand.name} checked={brand.isPublished} onClick={() => onTogglePublished(brand)} /></td>
      <td className="whitespace-nowrap px-5 py-4"><RowActions row={brand} onEdit={onEdit} onDelete={onDelete} /></td>
    </tr>)}{rows.length === 0 && <EmptyRow columns={6} kind="brands" />}</tbody>
  </table></div>;
}

function AttributeTable({ rows, onTogglePublished, onEdit, onDelete }: CatalogTableProps) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[950px] table-fixed divide-y divide-gray-100 text-left text-sm">
    <colgroup><col className="w-[7%]" /><col className="w-[19%]" /><col className="w-[34%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[9%]" /><col className="w-[15%]" /></colgroup>
    <thead className="border-b border-brand/10 bg-brand-soft/45 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600"><tr className="divide-x divide-gray-100">{["Id", "Attribute", "Option values", "Type", "Filter", "Publish", "Action"].map((heading) => <th key={heading} className="px-4 py-3.5">{heading}</th>)}</tr></thead>
    <tbody className="divide-y divide-gray-100 bg-white">{rows.map((attribute, index) => <tr key={attribute.id} className={`${index % 2 ? "bg-brand-soft/15" : "bg-white"} divide-x divide-gray-100 transition-colors hover:bg-orange-50/50`}>
      <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-700">{index + 1}</td>
      <td className="px-4 py-4"><strong className="block font-semibold text-gray-800">{attribute.name}</strong><small className="mt-1 block text-xs text-gray-400">{attribute.slug}</small></td>
      <td className="px-4 py-4 text-xs leading-5 text-gray-700">{attribute.options?.length ? attribute.options.map((option, optionIndex) => <span key={`${attribute.id}-${option}`} className="mr-1.5">{option}{optionIndex < (attribute.options?.length ?? 0) - 1 ? "," : ""}</span>) : <span className="text-gray-400">—</span>}</td>
      <td className="px-4 py-4 text-xs text-gray-700">Dropdown</td>
      <td className="px-4 py-4 text-xs text-gray-700">{attribute.showInFilter ? <span className="font-medium text-emerald-700">Shown</span> : <span className="text-gray-400">Hidden</span>}</td>
      <td className="whitespace-nowrap px-4 py-4"><PublishSwitch name={attribute.name} checked={attribute.isPublished} onClick={() => onTogglePublished(attribute)} /></td>
      <td className="whitespace-nowrap px-4 py-4"><RowActions row={attribute} onEdit={onEdit} onDelete={onDelete} /></td>
    </tr>)}{rows.length === 0 && <EmptyRow columns={7} kind="attributes" />}</tbody>
  </table></div>;
}

function ProductTable({ rows, selected, onToggleSelected, onToggleAll, onTogglePublished }: CatalogTableProps) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm">
    <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-[.12em] text-gray-500"><tr><th className="w-10 px-4 py-3"><input type="checkbox" className="size-4 accent-brand" aria-label="Select all products on this page" checked={rows.length > 0 && rows.every((row) => selected.includes(row.id))} onChange={onToggleAll} /></th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Category / Brand</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Status</th><th className="px-4 py-3 text-right">Visibility</th></tr></thead>
    <tbody className="divide-y divide-gray-100">{rows.map((row) => <tr key={row.id} className="transition hover:bg-gray-50/70"><td className="px-4 py-3"><input type="checkbox" className="size-4 accent-brand" aria-label={`Select ${row.name}`} checked={selected.includes(row.id)} onChange={() => onToggleSelected(row.id)} /></td><td className="px-3 py-3"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Box size={18} /></span><div><strong className="block text-sm font-semibold text-gray-800">{row.name}</strong><span className="mt-0.5 block text-[11px] text-gray-400">SKU: {row.sku} · {row.id}</span></div></div></td><td className="px-3 py-3"><span className="block text-xs font-medium text-gray-700">{row.category}</span><span className="mt-1 block text-[11px] text-gray-400">{row.brand}</span></td><td className="whitespace-nowrap px-3 py-3 text-sm font-semibold text-gray-800">{money(row.price)}</td><td className="px-3 py-3"><span className={`font-semibold ${row.stock === 0 ? "text-rose-600" : Number(row.stock) < 8 ? "text-accent" : "text-gray-700"}`}>{row.stock}</span><span className="ml-1 text-xs text-gray-400">units</span></td><td className="px-3 py-3"><StatusPill published={row.isPublished} /></td><td className="px-4 py-3 text-right"><PublishSwitch name={row.name} checked={row.isPublished} onClick={() => onTogglePublished(row)} /></td></tr>)}{rows.length === 0 && <EmptyRow columns={7} kind="products" />}</tbody>
  </table></div>;
}

function RowActions({ row, onEdit, onDelete }: { row: CatalogRecord; onEdit: (row: CatalogRecord) => void; onDelete: (row: CatalogRecord) => void }) {
  return <div className="flex items-center gap-1"><button type="button" onClick={() => onEdit(row)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-soft"><Edit3 size={14} /> Edit</button><button type="button" onClick={() => onDelete(row)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-accent transition hover:bg-orange-50"><Trash2 size={14} /> Delete</button></div>;
}
