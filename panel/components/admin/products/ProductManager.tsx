"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Box, CheckCircle2, CirclePlus, Edit3, LoaderCircle, PackageSearch, Search, Trash2 } from "lucide-react";
import { productsApi } from "@/features/products/api";
import type { Product } from "@/features/products/types";
import { usePermission } from "@/hooks/use-permission";
import { getErrorMessage } from "@/lib/api/errors";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";

const money = (value?: string | number | null) => value == null || value === "" ? "—" : new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(value));

export default function ProductManager() {
  const queryClient = useQueryClient();
  const canCreate = usePermission("products:create");
  const canUpdate = usePermission("products:update");
  const canDelete = usePermission("products:delete");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const products = useQuery({ queryKey: ["admin", "products"], queryFn: productsApi.list });
  const remove = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await showAdminNotice("Product deleted", "The product was removed from the catalog.", "success");
    },
  });
  const rows = useMemo(() => (products.data ?? []).filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesText = !query || [product.name, product.slug, product.category?.name, product.brand?.name, ...product.variants.map((variant) => variant.sku)].some((value) => value?.toLowerCase().includes(query));
    return matchesText && (status === "all" || product.status === status);
  }), [products.data, search, status]);
  const activeCount = products.data?.filter((item) => item.status === "active").length ?? 0;
  const stockCount = products.data?.reduce((sum, item) => sum + item.variants.reduce((variantSum, variant) => variantSum + variant.stockQty, 0), 0) ?? 0;

  const onDelete = async (product: Product) => {
    if (!await confirmAdminAction(`Delete ${product.name}?`, "The product will be archived from the catalog.")) return;
    remove.mutate(product.id);
  };

  return <div className="animate-fade-up space-y-5">
    <header className="rounded-3xl border border-brand/10 bg-gradient-to-r from-brand-soft/65 via-white to-orange-50/55 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-brand">Catalog workspace</p><h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">All Products</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage product details, variants, stock, and storefront visibility.</p></div>
        {canCreate && <Link href="/admin/products/new" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark lg:self-auto"><CirclePlus size={16} /> Add product</Link>}
      </div>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={Box} label="Total products" value={products.data?.length ?? 0} note="Catalog records" />
      <Stat icon={CheckCircle2} label="Active" value={activeCount} note="Visible on storefront" />
      <Stat icon={PackageSearch} label="Variants" value={products.data?.reduce((sum, item) => sum + item.variants.length, 0) ?? 0} note="Across all products" />
      <Stat icon={AlertTriangle} label="Units in stock" value={stockCount} note="Current variant stock" />
    </div>

    <section className="rounded-2xl border border-brand/10 bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, SKU, category…" className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"><option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select>
      </div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
      {products.isPending ? <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted"><LoaderCircle className="animate-spin" size={19} /> Loading products…</div> : products.isError ? <div className="p-8 text-center"><p className="font-semibold text-gray-800">Could not load products</p><p className="mt-1 text-sm text-gray-500">{getErrorMessage(products.error)}</p><button onClick={() => void products.refetch()} className="mt-4 rounded-lg border border-brand/20 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">Try again</button></div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-[.12em] text-gray-500"><tr><th className="px-5 py-3">Product</th><th className="px-3 py-3">Category / Brand</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{rows.map((product) => {
            const variant = product.variants.find((item) => item.isDefault) ?? product.variants[0];
            const stock = product.variants.reduce((sum, item) => sum + item.stockQty, 0);
            return <tr key={product.id} className="transition hover:bg-brand-soft/20"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Box size={18} /></span><div><strong className="block font-semibold text-gray-800">{product.name}</strong><span className="mt-1 block text-[11px] text-gray-400">{product.slug}{variant?.sku ? ` · ${variant.sku}` : ""}</span></div></div></td><td className="px-3 py-4"><span className="block text-xs font-medium text-gray-700">{product.category?.name ?? "Uncategorized"}</span><span className="mt-1 block text-[11px] text-gray-400">{product.brand?.name ?? "No brand"}</span></td><td className="whitespace-nowrap px-3 py-4 font-semibold text-gray-800">{money(variant?.price)}</td><td className="px-3 py-4"><span className={`font-semibold ${stock === 0 ? "text-rose-600" : "text-gray-700"}`}>{stock}</span><span className="ml-1 text-xs text-gray-400">units</span></td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${product.status === "active" ? "bg-emerald-50 text-emerald-700" : product.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{product.status}</span></td><td className="px-4 py-4"><div className="flex justify-end gap-1">{canUpdate && <Link href={`/admin/products/${product.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-soft"><Edit3 size={14} /> Edit</Link>}{canDelete && <button type="button" disabled={remove.isPending} onClick={() => void onDelete(product)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-accent transition hover:bg-orange-50 disabled:opacity-50"><Trash2 size={14} /> Delete</button>}</div></td></tr>;
          })}{rows.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center"><PackageSearch className="mx-auto text-gray-300" size={32} /><p className="mt-3 font-semibold text-gray-700">No products found</p><p className="mt-1 text-xs text-gray-400">Change your search or create a new product.</p></td></tr>}</tbody>
        </table>
      </div>}
    </section>
    {remove.isError && <p role="alert" className="text-sm text-red-600">{getErrorMessage(remove.error)}</p>}
  </div>;
}

function Stat({ icon: Icon, label, value, note }: { icon: typeof Box; label: string; value: number; note: string }) {
  return <article className="rounded-2xl border border-brand/10 bg-white p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value.toLocaleString()}</p><p className="mt-1 text-[11px] text-gray-400">{note}</p></div><span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={17} /></span></div></article>;
}
