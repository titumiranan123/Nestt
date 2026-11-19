"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CouponDrawerForm, type CouponFormValue } from "@/components/admin/tools/CouponDrawerForm";
import { CouponHeader } from "@/components/admin/tools/CouponHeader";
import { CouponSearchFilters } from "@/components/admin/tools/CouponSearchFilters";
import { CouponSummaryCards } from "@/components/admin/tools/CouponSummaryCards";
import { CouponTable } from "@/components/admin/tools/CouponTable";
import { couponsApi, type Coupon } from "@/features/coupons/api";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";

const newCoupon = (): CouponFormValue => ({ code: "", discountType: "PERCENTAGE", discountValue: 10, minOrder: null, maxDiscount: null, expiresAt: null, usageLimit: null, userLimit: null, isActive: true });
const couponQueryKey = ["admin-coupons"];

export function CouponsPage() {
  const queryClient = useQueryClient();
  const couponQuery = useQuery({ queryKey: couponQueryKey, queryFn: ({ signal }) => couponsApi.list(signal) });
  const coupons = couponQuery.data ?? [];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormValue>(newCoupon);
  const [actionError, setActionError] = useState("");
  const isExpired = (coupon: Coupon) => Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now());
  const visible = useMemo(() => coupons.filter((coupon) => coupon.code.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || (filter === "active" ? coupon.isActive && !isExpired(coupon) : !coupon.isActive || isExpired(coupon)))), [coupons, query, filter]);

  const saveMutation = useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: CouponFormValue }) => {
      const payload = { ...input, expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null };
      return id ? couponsApi.update(id, payload) : couponsApi.create(payload);
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: couponQueryKey }); },
  });
  const deleteMutation = useMutation({
    mutationFn: couponsApi.remove,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: couponQueryKey }); },
  });
  const statusMutation = useMutation({
    mutationFn: ({ coupon, isActive }: { coupon: Coupon; isActive: boolean }) => couponsApi.update(coupon.id, { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minOrder: coupon.minOrder, maxDiscount: coupon.discountType === "PERCENTAGE" ? coupon.maxDiscount : null, expiresAt: coupon.expiresAt, usageLimit: coupon.usageLimit, userLimit: coupon.userLimit, isActive }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: couponQueryKey }); },
  });

  const openCreate = () => { setEditing(null); setForm(newCoupon()); setActionError(""); setDrawerOpen(true); };
  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minOrder: coupon.minOrder, maxDiscount: coupon.maxDiscount, expiresAt: coupon.expiresAt ? new Date(new Date(coupon.expiresAt).getTime() - new Date(coupon.expiresAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : null, usageLimit: coupon.usageLimit, userLimit: coupon.userLimit, isActive: coupon.isActive });
    setActionError("");
    setDrawerOpen(true);
  };
  const saveCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError("");
    try {
      await saveMutation.mutateAsync({ id: editing?.id, input: { ...form, code: form.code.trim().toUpperCase() } });
      setDrawerOpen(false);
      void showAdminNotice(`Coupon ${editing ? "updated" : "created"}`, "Changes saved successfully.", "success");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save this coupon.");
    }
  };
  const deleteCoupon = async (coupon: Coupon) => {
    if (!(await confirmAdminAction(`Delete ${coupon.code}?`, "This coupon will be permanently removed."))) return;
    try {
      await deleteMutation.mutateAsync(coupon.id);
      void showAdminNotice("Coupon deleted", `${coupon.code} has been removed.`, "success");
    } catch (error) {
      void showAdminNotice("Could not delete coupon", error instanceof Error ? error.message : "Please try again.", "error");
    }
  };
  const toggleStatus = async (coupon: Coupon) => {
    const isActive = !coupon.isActive;
    if (!(await confirmAdminAction(`${isActive ? "Activate" : "Deactivate"} ${coupon.code}?`, "This updates the coupon status."))) return;
    try {
      await statusMutation.mutateAsync({ coupon, isActive });
    } catch (error) {
      void showAdminNotice("Could not update coupon", error instanceof Error ? error.message : "Please try again.", "error");
    }
  };
  const setField = <K extends keyof CouponFormValue>(key: K, value: CouponFormValue[K]) => setForm((current) => ({ ...current, [key]: value }));
  const activeCount = coupons.filter((coupon) => coupon.isActive && !isExpired(coupon)).length;

  return <div className="animate-fade-up space-y-5">
    <CouponHeader onCreate={openCreate}/>
    {couponQuery.isError && <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{couponQuery.error instanceof Error ? couponQuery.error.message : "Unable to load coupons."}</span><button onClick={() => void couponQuery.refetch()} className="font-semibold underline">Retry</button></div>}
    {actionError && !drawerOpen && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}
    <CouponSummaryCards total={coupons.length} active={activeCount} expired={coupons.filter(isExpired).length} uses={coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)}/>
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <CouponSearchFilters query={query} filter={filter} count={visible.length} onQuery={setQuery} onFilter={setFilter}/>
      {couponQuery.isLoading ? <p className="p-12 text-center text-sm text-gray-500">Loading coupons…</p> : <CouponTable coupons={visible} isExpired={isExpired} onEdit={openEdit} onDelete={(coupon) => void deleteCoupon(coupon)} onToggle={(coupon) => void toggleStatus(coupon)}/>}
    </section>
    <CouponDrawerForm open={drawerOpen} editing={editing} form={form} onChange={(key, value) => setField(key, value)} onClose={() => setDrawerOpen(false)} onSubmit={saveCoupon} saving={saveMutation.isPending} error={actionError}/>
  </div>;
}
