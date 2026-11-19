"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import { CatalogHeader } from "@/components/admin/catalog/CatalogHeader";
import CatalogFilters from "@/components/admin/catalog/CatalogFilters";
import CatalogPagination from "@/components/admin/catalog/CatalogPagination";
import CatalogTable from "@/components/admin/catalog/CatalogTable";
import { confirmAdminAction } from "@/lib/admin-swal";
import { getErrorMessage } from "@/lib/api/errors";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { attributeQueries, useAttributeActions } from "@/features/attributes/hooks";
import type { Attribute, AttributeInput, AttributeOptionInput } from "@/features/attributes/types";
import type { CatalogRecord } from "@/lib/catalog-demo-data";

type OptionDraft = { id?: string; name: string; value: string; image: string; isPublished: boolean };
type AttributeDraft = { name: string; slug: string; sortOrder: number; isPublished: boolean; showInFilter: boolean };

const inputClass = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-700";
const emptyDraft = (): AttributeDraft => ({ name: "", slug: "", sortOrder: 0, isPublished: true, showInFilter: true });
const slugFrom = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function toRecord(attribute: Attribute): CatalogRecord {
  return {
    id: attribute.id,
    name: attribute.name,
    slug: attribute.slug,
    isPublished: attribute.isPublished,
    type: "Dropdown",
    options: attribute.options.map((option) => option.name),
    showInFilter: attribute.showInFilter,
    sortOrder: attribute.sortOrder,
    createdAt: attribute.createdAt,
  };
}

function toOptionInput(option: OptionDraft, sortOrder: number): AttributeOptionInput {
  return {
    name: option.name.trim(),
    value: option.value.trim() || null,
    image: option.image.trim() || null,
    sortOrder,
    isPublished: option.isPublished,
  };
}

export default function AttributeCatalogManager() {
  const queryClient = useQueryClient();
  const query = useQuery(attributeQueries.list);
  const actions = useAttributeActions();
  const attributes = query.data ?? [];
  const rows = useMemo(() => attributes.map(toRecord), [attributes]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All status");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [draft, setDraft] = useState<AttributeDraft>(emptyDraft);
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const isSaving = actions.save.isPending;
  const busy = isSaving || actions.remove.isPending || actions.publish.isPending;
  const pageSize = 10;

  const filtered = useMemo(() => rows.filter((row) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || [row.name, row.slug, ...(row.options ?? [])].some((value) => value?.toLowerCase().includes(needle));
    const matchesStatus = status === "All status" || (status === "Published" ? row.isPublished : !row.isPublished);
    return matchesSearch && matchesStatus;
  }), [rows, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const startCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setOptions([]);
    setSubmitError("");
    setDrawerOpen(true);
  };

  const startEdit = async (row: CatalogRecord) => {
    setActionError("");
    setIsLoadingEdit(true);
    try {
      const attribute = await queryClient.fetchQuery(attributeQueries.detail(row.id));
      setEditing(attribute);
      setDraft({ name: attribute.name, slug: attribute.slug, sortOrder: attribute.sortOrder, isPublished: attribute.isPublished, showInFilter: attribute.showInFilter });
      setOptions(attribute.options.map((option) => ({ id: option.id, name: option.name, value: option.value ?? "", image: option.image ?? "", isPublished: option.isPublished })));
      setSubmitError("");
      setDrawerOpen(true);
    } catch (error) {
      const message = getErrorMessage(error, "Could not load this attribute.");
      setActionError(message);
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setSubmitError("");
    if (editing) {
      const optionVisibilityChanged = editing.options.some((previous) =>
        options.some((option) => option.id === previous.id && option.isPublished !== previous.isPublished),
      );
      if ((editing.isPublished !== draft.isPublished || optionVisibilityChanged) &&
        !await confirmAdminAction(`Update visibility for ${editing.name}?`, "The new publishing status will be applied to this attribute and its options when saved.")) return;
    }
    const input: AttributeInput = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || slugFrom(draft.name),
      type: "DROPDOWN",
      sortOrder: Number(draft.sortOrder),
      isPublished: draft.isPublished,
      showInFilter: draft.showInFilter,
    };
    try {
      await actions.save.mutateAsync({ existing: editing, input, options: options.map((option, index) => ({ id: option.id, input: toOptionInput(option, index) })) });
      setDrawerOpen(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "The attribute could not be saved."));
    }
  };

  const removeOption = async (index: number) => {
    const option = options[index];
    if (!option || isSaving || !await confirmAdminAction(`Remove ${option.name.trim() || `option ${index + 1}`}?`, "This option will be removed when you save the attribute.")) return;
    setOptions((current) => current.filter((item) => item !== option));
  };
  const remove = async (row: CatalogRecord) => {
    if (busy || !await confirmAdminAction(`Delete ${row.name}?`, "This attribute and its active option values will be removed from the catalog.")) return;
    setActionError("");
    actions.remove.mutate(row.id);
  };

  const togglePublished = async (row: CatalogRecord) => {
    const isPublished = !row.isPublished;
    if (busy || !await confirmAdminAction(`${isPublished ? "Publish" : "Unpublish"} ${row.name}?`, "This changes the storefront availability of the attribute.")) return;
    setActionError("");
    actions.publish.mutate({ id: row.id, isPublished });
  };

  const exportRows = () => {
    const csv = ["id,name,slug,type,options,status", ...filtered.map((row) => [row.id, row.name, row.slug, "DROPDOWN", (row.options ?? []).join(" | "), row.isPublished ? "Published" : "Draft"].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "attributes.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  if (query.isPending) return <AdminLoadingSkeleton kind="catalog" label="Loading attributes" />;
  if (query.isError && !query.data) return <section className="rounded-2xl border border-red-100 bg-white p-8 text-center"><h2 className="font-semibold text-gray-800">Could not load attributes</h2><p className="mt-1 text-sm text-red-700">{getErrorMessage(query.error)}</p><button type="button" onClick={() => void query.refetch()} className="mt-4 rounded-lg border border-brand/20 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">Try again</button></section>;

  return <div className="animate-fade-up space-y-5">
    <CatalogHeader eyebrow="Attributes" title="Attributes" description="Manage reusable product attributes, option values, filter visibility, and storefront availability from the live catalog." singular="Attribute" canCreate onCreate={startCreate} onExport={exportRows}/>
    {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}
    {isLoadingEdit && <AdminLoadingSkeleton kind="editor" label="Loading attribute details" />}
    <section className="rounded-2xl border border-brand/10 bg-white p-3 sm:p-4"><CatalogFilters kind="attributes" rows={rows} search={search} status={status} category="All categories" brand="All brands" onSearch={(value) => { setSearch(value); setPage(1); }} onStatus={(value) => { setStatus(value); setPage(1); }} onCategory={() => undefined} onBrand={() => undefined} onReset={() => { setSearch(""); setStatus("All status"); setPage(1); }}/></section>
    <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white"><CatalogTable kind="attributes" rows={visible} selected={[]} onToggleSelected={() => undefined} onToggleAll={() => undefined} onTogglePublished={(row) => void togglePublished(row)} onEdit={(row) => void startEdit(row)} onDelete={(row) => void remove(row)}/><CatalogPagination total={filtered.length} page={page} pageSize={pageSize} pageCount={pageCount} onPageChange={setPage}/></section>

    <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`${editing ? "Edit" : "Create"} Attribute`} description="Set the attribute details and the option values available to products.">
      <form onSubmit={save} className="flex min-h-full flex-col">
        <div className="flex-1 space-y-5 p-5 sm:p-6">
          <section className="space-y-4">
            <div><h3 className="text-sm font-bold text-gray-900">Basic information</h3><p className="mt-1 text-xs text-gray-500">Attributes use the dropdown type supported by the product schema.</p></div>
            <div><label className={labelClass} htmlFor="attribute-name">Name <span className="text-red-500">*</span></label><input id="attribute-name" required minLength={2} className={inputClass} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value, slug: current.slug || slugFrom(event.target.value) }))} placeholder="Color, Material, Room"/></div>
            <div><label className={labelClass} htmlFor="attribute-slug">Slug <span className="text-red-500">*</span></label><input id="attribute-slug" required pattern="[a-z0-9-]+" className={inputClass} value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="auto-generated-from-name"/></div>
            <div><label className={labelClass} htmlFor="attribute-sort-order">Sort order</label><input id="attribute-sort-order" type="number" min="0" className={inputClass} value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))}/></div>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-gray-900">Option values</h3><p className="mt-1 text-xs text-gray-500">Add variant values; value and image are optional metadata.</p></div><button type="button" onClick={() => setOptions((current) => [...current, { name: "", value: "", image: "", isPublished: true }])} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-brand/20 px-3 text-xs font-semibold text-brand hover:bg-brand-soft"><Plus size={14}/> Add option</button></div>
            {!options.length && <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">No option values yet.</p>}
            {options.map((option, index) => <div key={option.id ?? `new-${index}`} className="space-y-3 rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-gray-600">Option {index + 1}</span><button type="button" aria-label={`Remove option ${index + 1}`} onClick={() => void removeOption(index)} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15}/></button></div>
              <div><label className={labelClass} htmlFor={`attribute-option-name-${index}`}>Name <span className="text-red-500">*</span></label><input id={`attribute-option-name-${index}`} required className={inputClass} value={option.name} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="e.g. Natural oak"/></div>
              <div><label className={labelClass} htmlFor={`attribute-option-value-${index}`}>Value</label><input id={`attribute-option-value-${index}`} className={inputClass} value={option.value} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder="Optional value or code"/></div>
              <div><label className={labelClass} htmlFor={`attribute-option-image-${index}`}>Image URL</label><input id={`attribute-option-image-${index}`} type="url" className={inputClass} value={option.image} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, image: event.target.value } : item))} placeholder="https://…"/></div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700"><input type="checkbox" className="size-4 accent-brand" checked={option.isPublished} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isPublished: event.target.checked } : item))}/> Published option</label>
            </div>)}
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-5">
            <label className="flex items-start gap-3 rounded-lg"><input type="checkbox" className="mt-0.5 size-4 accent-brand" checked={draft.showInFilter} onChange={(event) => setDraft((current) => ({ ...current, showInFilter: event.target.checked }))}/><span><strong className="block text-xs font-semibold text-gray-800">Show in filters</strong><small className="mt-1 block text-xs text-gray-500">Let shoppers filter products by this attribute.</small></span></label>
            <label className="flex items-start gap-3 rounded-lg"><input type="checkbox" className="mt-0.5 size-4 accent-brand" checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))}/><span><strong className="block text-xs font-semibold text-gray-800">Published</strong><small className="mt-1 block text-xs text-gray-500">Make this attribute available to the storefront.</small></span></label>
          </section>
          {submitError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{submitError}</p>}
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-4 sm:px-6"><button type="button" disabled={isSaving} onClick={() => setDrawerOpen(false)} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving} className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Saving…" : editing ? "Save changes" : "Create Attribute"}</button></div>
      </form>
    </AdminDrawer>
  </div>;
}
