"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, Box, Layers3, SlidersHorizontal, Tag } from "lucide-react";
import CatalogFilters from "@/components/admin/catalog/CatalogFilters";
import CatalogFormDrawer from "@/components/admin/catalog/CatalogFormDrawer";
import { CatalogHeader } from "@/components/admin/catalog/CatalogHeader";
import CatalogPagination from "@/components/admin/catalog/CatalogPagination";
import CatalogStatsGrid, { type CatalogStat } from "@/components/admin/catalog/CatalogStatsGrid";
import CatalogTable from "@/components/admin/catalog/CatalogTable";
import AttributeCatalogManager from "@/components/admin/catalog/AttributeCatalogManager";
import CategoryCatalogManager from "@/components/admin/catalog/CategoryCatalogManager";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { demoAttributes, demoBrands, demoCategories, demoProducts, type CatalogRecord } from "@/lib/catalog-demo-data";

type CatalogKind = "products" | "categories" | "attributes" | "brands";
type CatalogForm = CatalogRecord;

const datasets: Record<CatalogKind, CatalogRecord[]> = {
  products: demoProducts,
  categories: demoCategories,
  attributes: demoAttributes,
  brands: demoBrands,
};

const config: Record<CatalogKind, { title: string; singular: string; eyebrow: string; description: string; icon: CatalogStat["icon"] }> = {
  products: { title: "All Products", singular: "Product", eyebrow: "Catalog workspace", description: "Manage your product catalog, stock levels, visibility, and storefront details.", icon: Box },
  categories: { title: "Category List", singular: "Category", eyebrow: "Category", description: "Organize storefront navigation, publish status, and category media from one clean workspace.", icon: Layers3 },
  attributes: { title: "Attributes", singular: "Attribute", eyebrow: "Attributes", description: "Create reusable color, size, material, and option sets for product variants.", icon: SlidersHorizontal },
  brands: { title: "Brands", singular: "Brand", eyebrow: "Brands", description: "Manage brand identity, visibility, and storefront logo presentation.", icon: BadgeCheck },
};

const emptyForm = (): CatalogForm => ({ id: "", name: "", slug: "", isPublished: true, description: "", options: [], productCount: 0, price: 0, stock: 0 });
const makeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function CatalogManager({ kind }: { kind: CatalogKind }) {
  if (kind === "categories") return <CategoryCatalogManager />;
  if (kind === "attributes") return <AttributeCatalogManager />;
  return <DemoCatalogManager kind={kind} />;
}

function DemoCatalogManager({ kind }: { kind: Exclude<CatalogKind, "categories"> }) {
  const [rows, setRows] = useState<CatalogRecord[]>(() => datasets[kind].map((row) => ({ ...row, options: row.options ? [...row.options] : [] })));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All status");
  const [category, setCategory] = useState("All categories");
  const [brand, setBrand] = useState("All brands");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRecord | null>(null);
  const [form, setForm] = useState<CatalogForm>(emptyForm);
  const [optionText, setOptionText] = useState("");
  const pageSize = kind === "products" ? 8 : 10;
  const meta = config[kind];

  const filtered = useMemo(() => rows.filter((row) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [row.name, row.slug, row.id, row.sku, row.category, row.brand].some((value) => value?.toLowerCase().includes(query));
    const matchesStatus = status === "All status" || (status === "Published" ? row.isPublished : !row.isPublished);
    const matchesCategory = kind !== "products" || category === "All categories" || row.category === category;
    const matchesBrand = kind !== "products" || brand === "All brands" || row.brand === brand;
    return matchesQuery && matchesStatus && matchesCategory && matchesBrand;
  }), [rows, search, status, category, brand, kind]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const stats: CatalogStat[] = [
    { label: `Total ${kind}`, value: rows.length, icon: meta.icon, note: "In this demo workspace" },
    { label: "Published", value: rows.filter((row) => row.isPublished).length, icon: Tag, note: "Visible on storefront" },
    { label: "Draft", value: rows.filter((row) => !row.isPublished).length, icon: Box, note: "Not publicly visible" },
    { label: "Products linked", value: rows.reduce((sum, row) => sum + (row.productCount ?? 0), 0), icon: Layers3, note: "Across this collection" },
  ];

  const setField = (key: keyof CatalogRecord, value: string | boolean | number) => setForm((current) => ({ ...current, [key]: value }));
  const openCreate = () => { setEditing(null); setForm(emptyForm()); setOptionText(""); setDrawerOpen(true); };
  const openEdit = (row: CatalogRecord) => { setEditing(row); setForm({ ...row }); setOptionText(row.options?.join(", ") ?? ""); setDrawerOpen(true); };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const record = { ...form, name: form.name.trim(), slug: form.slug.trim() || makeSlug(form.name), createdAt: editing?.createdAt ?? new Date().toISOString(), options: kind === "attributes" ? optionText.split(",").map((value) => value.trim()).filter(Boolean) : form.options };
    if (editing) setRows((current) => current.map((row) => row.id === editing.id ? { ...row, ...record, id: row.id } : row));
    else {
      const prefix = kind === "products" ? "PR" : kind === "attributes" ? "ATR" : "BR";
      const next = String(Math.max(0, ...rows.map((row) => Number(row.id.match(/(\d+)$/)?.[1] ?? 0))) + 1).padStart(3, "0");
      setRows((current) => [{ ...record, id: `${prefix}-${next}` }, ...current]);
    }
    setDrawerOpen(false);
    void showAdminNotice(`${meta.singular} ${editing ? "updated" : "created"}`, "The change is saved in temporary demo data for this session.", "success");
  };
  const remove = async (row: CatalogRecord) => {
    if (!await confirmAdminAction(`Delete ${row.name}?`, "This only removes the item from the temporary demo list.")) return;
    setRows((current) => current.filter((item) => item.id !== row.id));
    setSelected((current) => current.filter((id) => id !== row.id));
  };
  const togglePublished = (row: CatalogRecord) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, isPublished: !item.isPublished } : item));
  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const toggleAll = () => setSelected((current) => visible.length && visible.every((row) => current.includes(row.id) ) ? current.filter((id) => !visible.some((row) => row.id === id)) : [...new Set([...current, ...visible.map((row) => row.id)])]);
  const reset = () => { setSearch(""); setStatus("All status"); setCategory("All categories"); setBrand("All brands"); setPage(1); };
  const exportRows = () => {
    const csv = ["id,name,slug,status", ...filtered.map((row) => [row.id, row.name, row.slug, row.isPublished ? "Published" : "Draft"].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${kind}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="animate-fade-up space-y-5">
    <CatalogHeader eyebrow={meta.eyebrow} title={meta.title} description={meta.description} singular={meta.singular} canCreate={kind !== "products"} onCreate={openCreate} onExport={exportRows}/>
    {kind === "products" && <CatalogStatsGrid stats={stats}/>}
    <section className="rounded-2xl border border-brand/10 bg-white p-3 sm:p-4">
      <CatalogFilters kind={kind} rows={rows} search={search} status={status} category={category} brand={brand} onSearch={(value) => { setSearch(value); setPage(1); }} onStatus={(value) => { setStatus(value); setPage(1); }} onCategory={(value) => { setCategory(value); setPage(1); }} onBrand={(value) => { setBrand(value); setPage(1); }} onReset={reset}/>
    </section>
    <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
      <CatalogTable kind={kind} rows={visible} selected={selected} onToggleSelected={toggleSelected} onToggleAll={toggleAll} onTogglePublished={togglePublished} onEdit={openEdit} onDelete={remove}/>
      <CatalogPagination total={filtered.length} page={page} pageSize={pageSize} pageCount={pageCount} onPageChange={setPage}/>
    </section>
    {kind !== "products" && <CatalogFormDrawer kind={kind} singular={meta.singular} open={drawerOpen} editing={editing} rows={rows} form={form} optionText={optionText} onOptionText={setOptionText} onChange={setField} onClose={() => setDrawerOpen(false)} onSubmit={save}/>}
  </div>;
}
