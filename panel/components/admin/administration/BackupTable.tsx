import type { DemoBackup } from "@/lib/admin-operations-demo";
import { BackupRow } from "@/components/admin/administration/BackupRow";

export function BackupTable({ backups, onView, onDownload }: { backups: DemoBackup[]; onView: (backup: DemoBackup) => void; onDownload: (backup: DemoBackup) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Backup file</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Started</th><th className="px-4 py-3">Finished</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{backups.map((item) => <BackupRow key={item.id} backup={item} onView={() => onView(item)} onDownload={() => onDownload(item)}/>)}{!backups.length && <tr><td colSpan={6} className="py-14 text-center text-sm text-gray-500">No backup runs in the demo history.</td></tr>}</tbody></table></div>;
}
