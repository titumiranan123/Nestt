import { Plus } from "lucide-react";

export function CouponHeader({ onCreate }: { onCreate: () => void }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.14em] text-brand">Promotion tools</p><h1 className="text-2xl font-bold tracking-tight text-gray-950">Coupon Management</h1><p className="mt-1 text-sm text-gray-500">Create and manage discount coupons for your customers.</p></div><button onClick={onCreate} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark sm:self-auto"><Plus size={16}/> Create Coupon</button></div>;
}
