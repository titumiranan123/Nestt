import { Hash, Percent } from "lucide-react";

import AdminDrawer from "@/components/admin/AdminDrawer";

import type { DemoCoupon } from "@/lib/admin-tools-demo";

import { NumberField } from "./NumberField";

const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

export type CouponFormValue = Omit<DemoCoupon, "id" | "usedCount">;

export function CouponDrawerForm({ open, editing, form, onChange, onClose, onSubmit }: { open: boolean; editing: DemoCoupon | null; form: CouponFormValue; onChange: <K extends keyof CouponFormValue>(key: K, value: CouponFormValue[K]) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <AdminDrawer open={open} onClose={onClose} title={editing ? "Edit Coupon" : "Create Coupon"} description={editing ? "Update coupon rules, dates, and activation state." : "Create a discount coupon for your customers."}><form onSubmit={onSubmit} className="flex min-h-full flex-col"><div className="grid flex-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
    <div className="sm:col-span-2"><label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-700"><Hash size={14} className="text-brand"/>Coupon code *</label><input required minLength={3} pattern="[A-Za-z0-9_]+" className={`${input} font-mono uppercase tracking-wider`} value={form.code} onChange={(event) => onChange("code", event.target.value.toUpperCase())} placeholder="NESTT10"/></div>
    <div><label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-700"><Percent size={14} className="text-brand"/>Discount type</label><div className="flex rounded-lg bg-gray-100 p-1">{(["PERCENTAGE", "FIXED"] as const).map((value) => <button type="button" key={value} onClick={() => onChange("discountType", value)} className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold transition ${form.discountType === value ? "bg-white text-brand shadow-sm" : "text-gray-500"}`}>{value === "PERCENTAGE" ? "Percent" : "Fixed ৳"}</button>)}</div></div>
    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Discount value *</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{form.discountType === "PERCENTAGE" ? "%" : "৳"}</span><input required type="number" min="0.01" max={form.discountType === "PERCENTAGE" ? 100 : undefined} step="0.01" className={`${input} pl-8`} value={form.discountValue} onChange={(event) => onChange("discountValue", Number(event.target.value))}/></div></div>
    <NumberField title="Minimum order" value={form.minOrder} placeholder="No minimum" onChange={(value) => onChange("minOrder", value)}/>{form.discountType === "PERCENTAGE" && <NumberField title="Maximum discount" value={form.maxDiscount} placeholder="No cap" onChange={(value) => onChange("maxDiscount", value)}/>}
    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Expiry date</label><input type="datetime-local" className={input} value={form.expiresAt ?? ""} onChange={(event) => onChange("expiresAt", event.target.value || null)}/><p className="mt-1 text-[11px] text-gray-400">Leave blank for no expiry.</p></div>
    <NumberField title="Total usage limit" value={form.usageLimit} placeholder="Unlimited" onChange={(value) => onChange("usageLimit", value)}/><NumberField title="Per user limit" value={form.userLimit} placeholder="Unlimited" onChange={(value) => onChange("userLimit", value)}/>
    <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 sm:col-span-2"><span><strong className="block text-xs text-gray-800">Active status</strong><small className="mt-1 block text-[11px] text-gray-500">Enable or disable this coupon immediately.</small></span><input type="checkbox" className="size-4 accent-brand" checked={form.isActive} onChange={(event) => onChange("isActive", event.target.checked)}/></label>
  </div><div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-4 sm:px-6"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">{editing ? "Update Coupon" : "Save Coupon"}</button></div></form></AdminDrawer>;
}
