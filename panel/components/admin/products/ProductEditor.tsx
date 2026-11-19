"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { productQueries, useProductActions } from "@/features/products/hooks";
import { categoryQueries } from "@/features/categories/hooks";
import type { Product, ProductCareItemInput, ProductInput, ProductSpecificationInput, ProductVariantInput } from "@/features/products/types";
import { attributeQueries } from "@/features/attributes/hooks";
import type { Attribute } from "@/features/attributes/types";
import { getErrorMessage } from "@/lib/api/errors";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { confirmAdminAction } from "@/lib/admin-swal";
import { ProductContentStep } from "./ProductContentStep";
import { ProductDetailsStep } from "./ProductDetailsStep";
import { ProductSeoAssemblyStep } from "./ProductSeoAssemblyStep";
import { ProductVariantsStep, type VariantDraft } from "./ProductVariantsStep";

type TabId = "details" | "variants" | "content" | "assembly";
const tabs: { id: TabId; label: string }[] = [{ id: "details", label: "Details" }, { id: "variants", label: "Variants" }, { id: "content", label: "Content" }, { id: "assembly", label: "Assembly & guarantee" }];

function emptyProduct(): ProductInput {
  return { name: "", slug: "", tags: [], categoryId: "", brandId: null, description: "", useEnvironment: "indoor", status: "draft", sortOrder: 0, isFeatured: false, isNewArrival: false, isBestSeller: false, isContractGrade: false, isCustomizable: false, isPriceOnRequest: false, customizableTextNote: "", assemblyRequired: true, assemblyDuration: null, assemblyPdfUrl: null, guaranteeDays: null, guaranteeLabel: null, guaranteeUrl: null, features: [], careItems: [], specification: { specs: [] } };
}

function variantDraft(variant: Product["variants"][number]): VariantDraft {
  return { id: variant.id, name: variant.name, slug: variant.slug, sku: variant.sku, barcode: variant.barcode, description: variant.description, status: variant.status, sortOrder: variant.sortOrder, isDefault: variant.isDefault, stockQty: variant.stockQty, lowStockAlertQty: variant.lowStockAlertQty, stockStatus: variant.stockStatus, price: Number(variant.price), isOnSale: variant.isOnSale, costPrice: variant.costPrice == null ? null : Number(variant.costPrice), requiresWhiteGlove: variant.requiresWhiteGlove, metaTitle: variant.metaTitle, metaDescription: variant.metaDescription, features: [...variant.features], specification: variant.specification ?? { specs: [] }, variantOptions: variant.variantOptions ?? [], media: variant.media ?? [] };
}

function numberOrNull(value: number | null | undefined) { return value == null || !Number.isFinite(value) ? null : value; }

function normalizeSpecification(value?: ProductSpecificationInput | null): ProductSpecificationInput {
  return {
    title: value?.title?.trim() || undefined,
    image: value?.image?.trim() || null,
    sortOrder: value?.sortOrder ?? 0,
    specs: (value?.specs ?? [])
      .filter((item) => item.label.trim() && item.value.trim())
      .map((item, index) => ({
        label: item.label.trim(),
        value: item.value.trim(),
        type: item.type ?? "TEXT",
        href: item.href?.trim() || null,
        sortOrder: index,
      })),
  };
}

export default function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const editMode = Boolean(productId);
  const [tab, setTab] = useState<TabId>("details");
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [variants, setVariants] = useState<VariantDraft[]>([{ name: "", slug: "", sku: "", price: 0, status: "draft", sortOrder: 0, isDefault: true, stockQty: 0, lowStockAlertQty: 5, stockStatus: "IN_STOCK", isOnSale: false, requiresWhiteGlove: false, features: [] }]);
  const { save } = useProductActions();
  const saving = save.isPending;
  const [errorMessage, setErrorMessage] = useState("");
  const product = useQuery({ ...productQueries.detail(productId ?? ""), enabled: Boolean(productId) });
  const categories = useQuery(categoryQueries.list);
  const brands = useQuery(productQueries.brands);
  const attributes = useQuery(attributeQueries.list);

  useEffect(() => {
    if (!product.data) return;
    const item = product.data;
    setForm({ name: item.name, slug: item.slug, tags: item.tags ?? [], categoryId: item.categoryId, brandId: item.brandId, description: item.description, useEnvironment: item.useEnvironment, status: item.status, sortOrder: item.sortOrder, isFeatured: item.isFeatured, isNewArrival: item.isNewArrival, isBestSeller: item.isBestSeller, isContractGrade: item.isContractGrade, isCustomizable: item.isCustomizable, isPriceOnRequest: item.isPriceOnRequest, customizableTextNote: item.customizableTextNote, assemblyRequired: item.assemblyRequired, assemblyDuration: item.assemblyDuration, assemblyPdfUrl: item.assemblyPdfUrl, guaranteeDays: item.guaranteeDays, guaranteeLabel: item.guaranteeLabel, guaranteeUrl: item.guaranteeUrl, features: item.features ?? [], careItems: item.careItems?.map(({ title, description, displayOrder }) => ({ title, description, displayOrder })) ?? [], specification: item.specification ?? { specs: [] } });
    setVariants(item.variants.map(variantDraft));
  }, [product.data]);

  const completion = useMemo(() => {
    const checks = [Boolean(form.name?.trim()), Boolean(form.categoryId), Boolean(form.description?.trim()), variants.length > 0 && variants.every((variant) => Boolean(variant.name.trim() && variant.sku.trim()))];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form.name, form.categoryId, form.description, variants]);
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  const totalStock = variants.reduce((sum, variant) => sum + Number(variant.stockQty ?? 0), 0);

  const setProductField = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setErrorMessage("");
    const previousProduct = product.data;
    if (previousProduct) {
      const previousVariants = new Map(previousProduct.variants.map((variant) => [variant.id, variant]));
      const variantStatusChanged = variants.some((variant) => {
        const previous = variant.id ? previousVariants.get(variant.id) : undefined;
        return previous && (previous.status !== variant.status || previous.stockStatus !== variant.stockStatus);
      });
      if ((previousProduct.status !== form.status || variantStatusChanged) &&
        !await confirmAdminAction(`Update status for ${previousProduct.name}?`, "Saving will apply the new product or variant status to the catalog.")) return;
    }
    try {
      const brandId = form.brandId?.trim() || null;
      const productInput: ProductInput = {
        ...form,
        name: form.name.trim(),
        slug: form.slug?.trim() || undefined,
        categoryId: form.categoryId,
        brandId,
        tags: (form.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
        description: form.description?.trim() || null,
        customizableTextNote: form.customizableTextNote?.trim() || null,
        features: (form.features ?? []).map((feature) => feature.trim()).filter(Boolean),
        careItems: (form.careItems ?? [])
          .filter((item) => item.title.trim())
          .map((item, index): ProductCareItemInput => ({
            title: item.title.trim(),
            description: item.description?.trim() || null,
            displayOrder: index,
          })),
        assemblyDuration: numberOrNull(form.assemblyDuration),
        assemblyPdfUrl: form.assemblyPdfUrl?.trim() || null,
        guaranteeDays: numberOrNull(form.guaranteeDays),
        guaranteeLabel: form.guaranteeLabel?.trim() || null,
        guaranteeUrl: form.guaranteeUrl?.trim() || null,
        specification: normalizeSpecification(form.specification),
      };
      const variantInputs = variants.map((variant, index): ProductVariantInput => ({
        name: variant.name.trim(),
        slug: variant.slug?.trim() || undefined,
        sku: variant.sku.trim(),
        barcode: variant.barcode?.trim() || null,
        description: variant.description?.trim() || null,
        status: variant.status ?? "draft",
        sortOrder: Number(variant.sortOrder ?? index),
        isDefault: variant.isDefault ?? false,
        stockQty: Number(variant.stockQty ?? 0),
        lowStockAlertQty: Number(variant.lowStockAlertQty ?? 5),
        stockStatus: variant.stockStatus ?? "IN_STOCK",
        price: Number(variant.price),
        isOnSale: variant.isOnSale ?? false,
        costPrice: variant.costPrice == null ? null : Number(variant.costPrice),
        requiresWhiteGlove: variant.requiresWhiteGlove ?? false,
        metaTitle: variant.metaTitle?.trim() || null,
        metaDescription: variant.metaDescription?.trim() || null,
        features: (variant.features ?? []).map((feature) => feature.trim()).filter(Boolean),
        specification: normalizeSpecification(variant.specification),
        variantOptions: (variant.variantOptions ?? []).map((option, optionIndex) => ({ attributeId: option.attributeId, attributeOptionId: option.attributeOptionId, displayValue: option.displayValue, displayImage: option.displayImage, sortOrder: optionIndex })),
        media: (variant.media ?? []).filter((media) => media.url.trim()).map((media, mediaIndex) => ({ url: media.url.trim(), type: media.type ?? "product", alt: media.alt?.trim() || null, isPrimary: mediaIndex === 0, displayOrder: mediaIndex, videoUrl: media.videoUrl ?? null, videoThumbnailUrl: media.videoThumbnailUrl ?? null })),
      }));

      const retained = new Set(variants.map((variant) => variant.id));
      const saved = await save.mutateAsync({
        id: productId,
        input: productInput,
        variants: variantInputs.map((input, index) => ({ input, id: variants[index].id })),
        removedVariantIds: (previousProduct?.variants ?? []).filter((variant) => !retained.has(variant.id)).map((variant) => variant.id),
      });
      router.push(`/admin/products/${saved.id}`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "The product could not be saved."));
    }
  };

  if ((productId && product.isPending) || categories.isPending || brands.isPending || attributes.isPending) return <AdminLoadingSkeleton kind="editor" label="Loading product workspace" />;
  if (product.isError) return <LoadError message={getErrorMessage(product.error)} onRetry={() => void product.refetch()} />;
  if (categories.isError || brands.isError || attributes.isError) return <LoadError message={getErrorMessage(categories.error ?? brands.error ?? attributes.error)} onRetry={() => { void categories.refetch(); void brands.refetch(); void attributes.refetch(); }} />;

  const activeContent = tab === "details" ? <ProductDetailsStep value={form} categories={categories.data ?? []} brands={brands.data ?? []} set={setProductField} />
    : tab === "variants" ? <ProductVariantsStep variants={variants} attributes={attributes.data ?? []} setVariants={setVariants} />
    : tab === "content" ? <ProductContentStep features={form.features ?? []} note={form.customizableTextNote ?? ""} careItems={form.careItems ?? []} specification={form.specification} onFeatures={(features) => setProductField("features", features)} onNote={(note) => setProductField("customizableTextNote", note)} onCareItems={(careItems) => setProductField("careItems", careItems)} onSpecification={(specification) => setProductField("specification", specification)} />
    : <ProductSeoAssemblyStep value={form} set={(key, next) => setForm((current) => ({ ...current, [key]: next }))} />;

  return <form onSubmit={onSubmit} className="space-y-5">
    <header className="rounded-3xl border border-brand/10 bg-gradient-to-r from-brand-soft/65 via-white to-orange-50/55 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-[.16em] text-brand"><Link href="/admin" className="hover:text-accent">Dashboard</Link><ChevronRight size={13} /><Link href="/admin/products" className="hover:text-accent">Products</Link><ChevronRight size={13} /><span className="text-accent">{editMode ? "Edit" : "Create"}</span></div><h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{editMode ? "Edit product" : "Create product"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Set up product details, variants, customer-facing content, and assembly information.</p></div><div className="flex gap-2"><Link href="/admin/products" className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"><ArrowLeft size={15} /> Cancel</Link><button type="submit" disabled={saving || !form.name.trim() || !form.categoryId || categories.isError} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"><Save size={15} />{saving ? "Saving…" : editMode ? "Update product" : "Create product"}</button></div></div>
    </header>
    {errorMessage && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
    {categories.isError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Categories could not be loaded. Try again before saving.</p>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <nav aria-label="Product form sections" className="grid grid-cols-2 gap-2 rounded-2xl border border-brand/10 bg-white p-2 md:grid-cols-4">{tabs.map((item) => <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${tab === item.id ? "bg-brand text-white shadow-sm" : "text-gray-600 hover:bg-brand-soft hover:text-brand"}`}>{item.label}</button>)}</nav>
        {activeContent}
      </div>
      <aside className="space-y-4 xl:sticky xl:top-5">
        <section className="rounded-2xl border border-brand/10 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-ink">Workspace progress</h2><span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{completion}%</span></div><div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${completion}%` }} /></div><p className="text-xs leading-5 text-muted">Complete the core details and add a sellable variant before publishing.</p><button type="button" onClick={() => setProductField("status", "draft")} className="mt-4 block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:border-brand/30">Status <span className="float-right capitalize text-brand">{form.status}</span></button></section>
        <section className="rounded-2xl border border-brand/10 bg-white p-5"><h2 className="mb-3 font-semibold text-ink">Product summary</h2><Summary label="Variants" value={String(variants.length)} /><Summary label="Units in stock" value={totalStock.toLocaleString()} /><Summary label="Default price" value={defaultVariant?.price ? new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(defaultVariant.price)) : "Not set"} /><Summary label="Category" value={categories.data?.find((item) => item.id === form.categoryId)?.name ?? "Not selected"} /></section>
        <section className="rounded-2xl border border-brand/10 bg-white p-5"><h2 className="mb-3 font-semibold text-ink">Storefront flags</h2><div className="space-y-2 text-xs text-gray-600">{[["Featured", form.isFeatured], ["New arrival", form.isNewArrival], ["Best seller", form.isBestSeller], ["Customizable", form.isCustomizable]].map(([label, enabled]) => <div key={String(label)} className="flex justify-between"><span>{String(label)}</span><span className={enabled ? "font-semibold text-emerald-700" : "text-gray-400"}>{enabled ? "On" : "Off"}</span></div>)}</div></section>
      </aside>
    </div>
  </form>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-t border-gray-100 py-2.5 text-xs"><span className="text-gray-500">{label}</span><span className="max-w-[58%] truncate font-semibold text-gray-800">{value}</span></div>; }

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) { return <section className="rounded-2xl border border-red-100 bg-white p-8 text-center"><p className="font-semibold text-gray-800">Could not load product</p><p className="mt-1 text-sm text-gray-500">{message}</p><button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-brand/20 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">Try again</button></section>; }
