import { Clock3, Globe2, UserRound } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import type { DemoAuditLog } from "@/lib/admin-operations-demo";

export function AuditLogDrawer({ log, onClose }: { log: DemoAuditLog | null; onClose: () => void }) {
  return <AdminDrawer open={Boolean(log)} onClose={onClose} title="Audit event details" description={log?.id ?? "Select an audit event."}>{log && <div className="space-y-4 p-5 sm:p-6"><Detail icon={<UserRound size={16}/>} label="Actor" value={`${log.actor} · ${log.role.replaceAll("_", " ")}`}/><Detail icon={<Clock3 size={16}/>} label="Timestamp" value={new Date(log.createdAt).toLocaleString()}/><Detail icon={<Globe2 size={16}/>} label="IP address" value={log.ip}/><div className="rounded-lg border border-gray-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Action</p><p className="mt-1 text-sm font-bold text-gray-900">{log.action}</p><p className="mt-1 text-xs text-gray-500">{log.resource}</p><p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-6 text-gray-600">{log.details}</p></div><button onClick={onClose} className="h-10 w-full rounded-lg border border-gray-200 text-sm font-semibold text-gray-600">Close details</button></div>}</AdminDrawer>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"><span className="mt-0.5 text-brand">{icon}</span><div><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 text-sm font-medium text-gray-800">{value}</p></div></div>;
}
