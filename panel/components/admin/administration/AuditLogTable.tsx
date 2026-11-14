import type { DemoAuditLog } from "@/lib/admin-operations-demo";
import { AuditLogRow } from "@/components/admin/administration/AuditLogRow";

export function AuditLogTable({ logs, onView }: { logs: DemoAuditLog[]; onView: (log: DemoAuditLog) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Date & time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">IP address</th><th className="px-4 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-gray-100">{logs.map((log) => <AuditLogRow key={log.id} log={log} onView={() => onView(log)}/>)}{!logs.length && <tr><td colSpan={7} className="py-14 text-center text-sm text-gray-500">No audit events match these filters.</td></tr>}</tbody></table></div>;
}
