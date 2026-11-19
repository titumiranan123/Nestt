import { CheckCircle2, Clock3, Database } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import type { DemoBackup } from "@/lib/admin-operations-demo";
import type { BackupRecord } from "@/lib/api/admin-tools";

export function BackupDetailsDrawer({ backup, onClose }: { backup: BackupRecord | DemoBackup | null; onClose: () => void }) {
  const error = backup && "error" in backup ? backup.error : undefined;
  return <AdminDrawer open={Boolean(backup)} onClose={onClose} title="Backup run details" description={backup?.id ?? "Select a backup record."}>{backup && <div className="space-y-4 p-5 sm:p-6"><div className="rounded-xl bg-brand-soft p-4"><Database size={20} className="text-brand"/><p className="mt-3 break-all text-sm font-bold text-gray-900">{backup.filename}</p><p className="mt-1 text-xs text-gray-500">{backup.type} backup · {backup.size}</p></div><Detail icon={<CheckCircle2 size={16}/>} label="Status" value={backup.status}/><Detail icon={<Clock3 size={16}/>} label="Started" value={backup.startedAt}/><Detail icon={<Clock3 size={16}/>} label="Finished" value={backup.finishedAt}/>{error && <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}<button onClick={onClose} className="h-10 w-full rounded-lg border border-gray-200 text-sm font-semibold text-gray-600">Close</button></div>}</AdminDrawer>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"><span className="text-brand">{icon}</span><span className="flex-1 text-xs text-gray-500">{label}</span><strong className="text-xs text-gray-800">{value}</strong></div>;
}
