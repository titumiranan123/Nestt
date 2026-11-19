import type { Coupon } from "@/features/coupons/api";

import { CouponRow } from "./CouponRow";

export function CouponTable({ coupons, isExpired, onEdit, onDelete, onToggle }: { coupons: Coupon[]; isExpired: (coupon: Coupon) => boolean; onEdit: (coupon: Coupon) => void; onDelete: (coupon: Coupon) => void; onToggle: (coupon: Coupon) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-[.12em] text-gray-500"><tr>{["Coupon", "Type", "Limits", "Usage", "Expiry", "Status", "Actions"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{coupons.map((coupon) => <CouponRow key={coupon.id} coupon={coupon} expired={isExpired(coupon)} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle}/>)}{coupons.length === 0 && <tr><td colSpan={7} className="py-14 text-center text-sm text-gray-500">No coupon matched this search.</td></tr>}</tbody></table></div>;
}
