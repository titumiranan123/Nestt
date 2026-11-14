import { useMemo, useState } from "react";

import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";

import { demoCoupons, type DemoCoupon } from "@/lib/admin-tools-demo";

import { CouponDrawerForm } from "@/components/admin/tools/CouponDrawerForm";

import { CouponHeader } from "@/components/admin/tools/CouponHeader";

import { CouponSearchFilters } from "@/components/admin/tools/CouponSearchFilters";

import { CouponSummaryCards } from "@/components/admin/tools/CouponSummaryCards";

import { CouponTable } from "@/components/admin/tools/CouponTable";

import type { CouponFormValue } from "@/components/admin/tools/CouponDrawerForm";

const newCoupon = (): CouponFormValue => ({ code: "", discountType: "PERCENTAGE", discountValue: 10, minOrder: null, maxDiscount: null, expiresAt: null, usageLimit: null, userLimit: null, isActive: true });

export function CouponsPage() {
  const [coupons, setCoupons] = useState<DemoCoupon[]>(() => demoCoupons.map((item) => ({ ...item })));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DemoCoupon | null>(null);
  const [form, setForm] = useState<CouponFormValue>(newCoupon);
  const isExpired = (coupon: DemoCoupon) => Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now());
  const visible = useMemo(() => coupons.filter((coupon) => coupon.code.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || (filter === "active" ? coupon.isActive && !isExpired(coupon) : !coupon.isActive || isExpired(coupon)))), [coupons, query, filter]);

  const openCreate = () => { setEditing(null); setForm(newCoupon()); setDrawerOpen(true); };
  const openEdit = (coupon: DemoCoupon) => {
    setEditing(coupon);
    setForm({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minOrder: coupon.minOrder, maxDiscount: coupon.maxDiscount, expiresAt: coupon.expiresAt ? new Date(new Date(coupon.expiresAt).getTime() - new Date(coupon.expiresAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : null, usageLimit: coupon.usageLimit, userLimit: coupon.userLimit, isActive: coupon.isActive });
    setDrawerOpen(true);
  };
  const saveCoupon = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = { ...form, code: form.code.trim().toUpperCase() };
    if (coupons.some((coupon) => coupon.code === normalized.code && coupon.id !== editing?.id)) {
      void showAdminNotice("Coupon code already exists", "Choose a different code for this demo coupon.", "warning");
      return;
    }
    if (editing) setCoupons((current) => current.map((coupon) => coupon.id === editing.id ? { ...coupon, ...normalized } : coupon));
    else setCoupons((current) => [{ ...normalized, id: `CP-${String(Date.now()).slice(-5)}`, usedCount: 0 }, ...current]);
    setDrawerOpen(false);
    void showAdminNotice(`Coupon ${editing ? "updated" : "created"}`, "Changes are stored in this temporary demo session.", "success");
  };
  const deleteCoupon = async (coupon: DemoCoupon) => {
    if (!(await confirmAdminAction(`Delete ${coupon.code}?`, "This coupon will be removed from the temporary demo list."))) return;
    setCoupons((current) => current.filter((item) => item.id !== coupon.id));
  };
  const setField = <K extends keyof CouponFormValue>(key: K, value: CouponFormValue[K]) => setForm((current) => ({ ...current, [key]: value }));
  const activeCount = coupons.filter((coupon) => coupon.isActive && !isExpired(coupon)).length;

  return <div className="animate-fade-up space-y-5">
    <CouponHeader onCreate={openCreate}/>
    <CouponSummaryCards total={coupons.length} active={activeCount} expired={coupons.filter(isExpired).length} uses={coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)}/>
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <CouponSearchFilters query={query} filter={filter} count={visible.length} onQuery={setQuery} onFilter={setFilter}/>
      <CouponTable coupons={visible} isExpired={isExpired} onEdit={openEdit} onDelete={(coupon) => void deleteCoupon(coupon)} onToggle={(coupon) => setCoupons((current) => current.map((item) => item.id === coupon.id ? { ...item, isActive: !item.isActive } : item))}/>
    </section>
    <CouponDrawerForm open={drawerOpen} editing={editing} form={form} onChange={(key, value) => setField(key, value)} onClose={() => setDrawerOpen(false)} onSubmit={saveCoupon}/>
  </div>;
}
