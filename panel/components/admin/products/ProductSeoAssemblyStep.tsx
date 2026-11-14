"use client";

import type { ProductInput } from "@/features/products/types";
import { Field, TextField, ToggleField } from "./ProductFormFields";

type Assembly = Pick<ProductInput, "assemblyRequired" | "assemblyDuration" | "assemblyPdfUrl" | "guaranteeDays" | "guaranteeLabel" | "guaranteeUrl">;

export function ProductSeoAssemblyStep({ value, set }: { value: Assembly; set: <K extends keyof Assembly>(key: K, next: Assembly[K]) => void }) {
  return <section className="overflow-hidden rounded-2xl border border-brand/10 bg-white">
    <div className="border-b border-brand/10 px-5 py-4"><h2 className="font-semibold text-ink">Assembly & guarantee</h2><p className="mt-1 text-xs text-muted">Product-level setup and guarantee details supported by the Nestt schema.</p></div>
    <div className="grid gap-4 p-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><ToggleField label="Assembly required" checked={value.assemblyRequired ?? true} onChange={(next) => set("assemblyRequired", next)} /></div>
      <TextField label="Assembly duration (minutes)" type="number" min="0" step="1" value={value.assemblyDuration ?? ""} onChange={(next) => set("assemblyDuration", next === "" ? null : Math.max(0, Number(next) || 0))} />
      <TextField label="Assembly guide PDF URL" type="url" value={value.assemblyPdfUrl ?? ""} onChange={(next) => set("assemblyPdfUrl", next || null)} placeholder="https://…" />
      <TextField label="Guarantee duration (days)" type="number" min="0" step="1" value={value.guaranteeDays ?? ""} onChange={(next) => set("guaranteeDays", next === "" ? null : Math.max(0, Number(next) || 0))} />
      <TextField label="Guarantee label" value={value.guaranteeLabel ?? ""} onChange={(next) => set("guaranteeLabel", next || null)} placeholder="e.g. 5-year frame guarantee" />
      <div className="sm:col-span-2"><Field label="Guarantee details URL"><input className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10" type="url" value={value.guaranteeUrl ?? ""} onChange={(event) => set("guaranteeUrl", event.target.value || null)} placeholder="https://…" /></Field></div>
    </div>
  </section>;
}
