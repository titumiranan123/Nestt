"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CatalogFilters from "@/components/admin/catalog/CatalogFilters";
import CatalogFormDrawer from "@/components/admin/catalog/CatalogFormDrawer";
import { CatalogHeader } from "@/components/admin/catalog/CatalogHeader";
import CatalogPagination from "@/components/admin/catalog/CatalogPagination";
import CatalogTable from "@/components/admin/catalog/CatalogTable";
import type { CatalogRecord } from "@/lib/catalog-demo-data";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { getErrorMessage } from "@/lib/api/errors";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { categoriesApi } from "@/features/categories/api";
import type { Category, CategoryInput } from "@/features/categories/types";

const emptyForm = (): CatalogRecord => ({
  id: "",
  name: "",
  slug: "",
  isPublished: true,
  isPopular: false,
  description: "",
  parentId: null,
  sortOrder: 0,
  logo: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
});

const makeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function categoryToRecord(category: Category): CatalogRecord {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    isPublished: category.isPublished,
    isPopular: category.isPopularCat,
    description: category.description ?? "",
    parentId: category.parentId,
    parent: category.parent?.name ?? "",
    sortOrder: category.sortOrder,
    logo: category.logo ?? "",
    metaTitle: category.metaTitle ?? "",
    metaDescription: category.metaDescription ?? "",
    metaKeywords: category.metaKeywords.join(", "),
    productCount: category._count?.products ?? 0,
    createdAt: category.createdAt,
  };
}

function recordToInput(form: CatalogRecord): CategoryInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || makeSlug(form.name),
    description: form.description?.trim() || null,
    parentId: form.parentId || null,
    sortOrder: Number(form.sortOrder ?? 0),
    logo: form.logo?.trim() || null,
    isPublished: Boolean(form.isPublished),
    isPopularCat: Boolean(form.isPopular),
    metaTitle: form.metaTitle?.trim() || null,
    metaDescription: form.metaDescription?.trim() || null,
    metaKeywords: (form.metaKeywords ?? "").split(",").map((keyword) => keyword.trim()).filter(Boolean),
  };
}

export default function CategoryCatalogManager() {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ["admin", "categories"], queryFn: categoriesApi.list });
  const rows = useMemo(() => (categoriesQuery.data ?? []).map(categoryToRecord), [categoriesQuery.data]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All status");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRecord | null>(null);
  const [form, setForm] = useState<CatalogRecord>(emptyForm);
  const [optionText, setOptionText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const pageSize = 10;

  const filtered = useMemo(() => rows.filter((row) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [row.name, row.slug, row.id, row.parent].some((value) => value?.toLowerCase().includes(query));
    const matchesStatus = status === "All status" || (status === "Published" ? row.isPublished : !row.isPublished);
    return matchesQuery && matchesStatus;
  }), [rows, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const setField = (key: keyof CatalogRecord, value: string | boolean | number) => setForm((current) => ({ ...current, [key]: value }));
  const resetForm = () => {
    setSubmitError("");
    setOptionText("");
  };
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    resetForm();
    setDrawerOpen(true);
  };
  const openEdit = async (row: CatalogRecord) => {
    setIsLoadingEdit(true);
    setActionError("");
    try {
      const category = await categoriesApi.get(row.id);
      setEditing(row);
      setForm(categoryToRecord(category));
      resetForm();
      setDrawerOpen(true);
    } catch (error) {
      setActionError(getErrorMessage(error, "Could not load this category."));
      await showAdminNotice("Category could not be loaded", getErrorMessage(error), "error");
    } finally {
      setIsLoadingEdit(false);
    }
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSubmitError("");
    try {
      const input = recordToInput(form);
      const saved = editing ? await categoriesApi.update(editing.id, input) : await categoriesApi.create(input);
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setDrawerOpen(false);
      setSelected((current) => current.filter((id) => id !== saved.id));
      await showAdminNotice(`Category ${editing ? "updated" : "created"}`, `${saved.name} has been saved.`, "success");
    } catch (error) {
      const message = getErrorMessage(error, "The category could not be saved.");
      setSubmitError(message);
    } finally {
      setIsSaving(false);
    }
  };
  const remove = async (row: CatalogRecord) => {
    if (!await confirmAdminAction(`Delete ${row.name}?`, "This category will be removed from the active catalog.")) return;
    try {
      await categoriesApi.remove(row.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setSelected((current) => current.filter((id) => id !== row.id));
      await showAdminNotice("Category deleted", `${row.name} has been removed.`, "success");
    } catch (error) {
      const message = getErrorMessage(error, "The category could not be deleted.");
      setActionError(message);
      await showAdminNotice("Category could not be deleted", message, "error");
    }
  };
  const togglePublished = async (row: CatalogRecord) => {
    try {
      await categoriesApi.update(row.id, { isPublished: !row.isPublished });
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch (error) {
      const message = getErrorMessage(error, "Category visibility could not be updated.");
      setActionError(message);
      await showAdminNotice("Category could not be updated", message, "error");
    }
  };
  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const toggleAll = () => setSelected((current) => visible.length && visible.every((row) => current.includes(row.id)) ? current.filter((id) => !visible.some((row) => row.id === id)) : [...new Set([...current, ...visible.map((row) => row.id)])]);
  const resetFilters = () => { setSearch(""); setStatus("All status"); setPage(1); };
  const exportRows = () => {
    const csv = ["id,name,slug,status,parent", ...filtered.map((row) => [row.id, row.name, row.slug, row.isPublished ? "Published" : "Draft", row.parent ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "categories.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  if (categoriesQuery.isPending) return <AdminLoadingSkeleton kind="catalog" label="Loading categories" />;
  if (categoriesQuery.isError) return <section className="rounded-2xl border border-red-100 bg-white p-8 text-center"><h2 className="font-semibold text-gray-800">Could not load categories</h2><p className="mt-1 text-sm text-red-700">{getErrorMessage(categoriesQuery.error)}</p><button type="button" onClick={() => void categoriesQuery.refetch()} className="mt-4 rounded-lg border border-brand/20 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">Try again</button></section>;

  return <div className="animate-fade-up space-y-5">
    <CatalogHeader eyebrow="Category" title="Category List" description="Organize storefront navigation, publish status, and category media from the live catalog." singular="Category" canCreate onCreate={openCreate} onExport={exportRows}/>
    {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}
    {isLoadingEdit && <AdminLoadingSkeleton kind="editor" label="Loading category details" />}
    <section className="rounded-2xl border border-brand/10 bg-white p-3 sm:p-4">
      <CatalogFilters kind="categories" rows={rows} search={search} status={status} category="All categories" brand="All brands" onSearch={(value) => { setSearch(value); setPage(1); }} onStatus={(value) => { setStatus(value); setPage(1); }} onCategory={() => undefined} onBrand={() => undefined} onReset={resetFilters}/>
    </section>
    <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
      <CatalogTable kind="categories" rows={visible} selected={selected} onToggleSelected={toggleSelected} onToggleAll={toggleAll} onTogglePublished={(row) => void togglePublished(row)} onEdit={(row) => void openEdit(row)} onDelete={(row) => void remove(row)}/>
      <CatalogPagination total={filtered.length} page={page} pageSize={pageSize} pageCount={pageCount} onPageChange={setPage}/>
    </section>
    <CatalogFormDrawer kind="categories" singular="Category" open={drawerOpen} editing={editing} rows={rows} form={form} optionText={optionText} onOptionText={setOptionText} onChange={setField} onClose={() => setDrawerOpen(false)} onSubmit={save} isSaving={isSaving} submitError={submitError}/>
  </div>;
}
