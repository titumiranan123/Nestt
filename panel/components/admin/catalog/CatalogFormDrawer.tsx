import type { FormEvent } from "react";

import AdminDrawer from "@/components/admin/AdminDrawer";

import type { CatalogRecord } from "@/lib/catalog-demo-data";

import { BasicFields } from "./BasicFields";

import { CategoryFields } from "./CategoryFields";

import { AttributeFields } from "./AttributeFields";

import { BrandFields } from "./BrandFields";

import { VisibilityFields } from "./VisibilityFields";

import { SeoFields } from "./SeoFields";

import { DrawerActions } from "./DrawerActions";

type CatalogKind = "products" | "categories" | "attributes" | "brands";

export default function CatalogFormDrawer({ kind, singular, open, editing, rows, form, optionText, onOptionText, onChange, onClose, onSubmit }: {
  kind: CatalogKind;
  singular: string;
  open: boolean;
  editing: CatalogRecord | null;
  rows: CatalogRecord[];
  form: CatalogRecord;
  optionText: string;
  onOptionText: (value: string) => void;
  onChange: (key: keyof CatalogRecord, value: string | boolean | number) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const description = kind === "attributes" ? "Set the attribute details, options, and filter visibility." : kind === "categories" ? "Add a category and choose how products appear in the catalog." : "Set brand profile, verification, and storefront visibility.";
  return <AdminDrawer open={open} onClose={onClose} title={`${editing ? "Edit" : "Create"} ${singular}`} description={description}>
    <form onSubmit={onSubmit} className="flex min-h-full flex-col">
      <div className="flex-1 space-y-5 p-5 sm:p-6">
        <BasicFields singular={singular} form={form} onChange={onChange}/>
        {kind === "categories" && <CategoryFields form={form} rows={rows} onChange={onChange}/>}
        {kind === "attributes" && <AttributeFields form={form} optionText={optionText} onOptionText={onOptionText} onChange={onChange}/>}
        {kind === "brands" && <BrandFields form={form} onChange={onChange}/>}
        <VisibilityFields kind={kind} form={form} onChange={onChange}/>
        {kind === "brands" && <SeoFields prefix="brand" form={form} onChange={onChange}/>}
      </div>
      <DrawerActions editing={Boolean(editing)} singular={singular} onClose={onClose}/>
    </form>
  </AdminDrawer>;
}
