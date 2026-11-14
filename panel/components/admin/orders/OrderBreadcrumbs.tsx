import Link from "next/link";

import AdminIcon from "@/components/admin/AdminIcon";

export function OrderBreadcrumbs({ id }: { id: string }) {
  return <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb"><Link className="hover:text-brand" href="/admin">Dashboard</Link><AdminIcon name="chev" size={14}/><Link className="hover:text-brand" href="/admin/orders">Orders</Link><AdminIcon name="chev" size={14}/><span className="font-medium text-gray-800">{id}</span></nav>;
}
