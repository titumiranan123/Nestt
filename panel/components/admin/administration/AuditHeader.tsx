import { History } from "lucide-react";

export function AuditHeader() {
  return <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-brand"><History size={15}/> Administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Audit Logs</h1><p className="mt-1 text-sm text-gray-500">Review staff, customer, and system changes from this local activity sample.</p></header>;
}
