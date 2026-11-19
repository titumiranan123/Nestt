"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import type { DemoBackup } from "@/lib/admin-operations-demo";
import { backupApi, type BackupRecord } from "@/lib/api/admin-tools";
import { getErrorMessage } from "@/lib/api/errors";
import { BackupDetailsDrawer } from "@/components/admin/administration/BackupDetailsDrawer";
import { BackupHeader } from "@/components/admin/administration/BackupHeader";
import { BackupStats } from "@/components/admin/administration/BackupStats";
import { BackupTable } from "@/components/admin/administration/BackupTable";

export function BackupManager() {
  const queryClient = useQueryClient();
  const backupQuery = useQuery({ queryKey: ["admin", "backups"], queryFn: ({ signal }) => backupApi.list(signal) });
  const backups: BackupRecord[] = backupQuery.data ?? [];
  const createMutation = useMutation({ mutationFn: backupApi.create, onSuccess: async (backup) => { await queryClient.invalidateQueries({ queryKey: ["admin", "backups"] }); if (backup.status === "SUCCESS") void showAdminNotice("Backup complete", `${backup.filename} is ready to download.`, "success"); else void showAdminNotice("Backup failed", backup.error ?? "The database backup could not be completed.", "error"); } });
  const [selected, setSelected] = useState<DemoBackup | null>(null);
  const createBackup = async () => {
    if (!await confirmAdminAction("Create a database backup?", "This will run pg_dump and store the SQL file on the server.")) return;
    try { await createMutation.mutateAsync(); }
    catch (error) { void showAdminNotice("Backup request failed", getErrorMessage(error), "error"); }
  };
  const downloadBackup = async (backup: DemoBackup) => {
    try {
      const blob = await backupApi.download(backup.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = backup.filename; anchor.click(); URL.revokeObjectURL(url);
    } catch (error) { void showAdminNotice("Backup download failed", getErrorMessage(error), "error"); }
  };
  return <div className="animate-fade-up space-y-5">{backupQuery.isError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{getErrorMessage(backupQuery.error)} <button onClick={() => void backupQuery.refetch()} className="ml-2 font-semibold underline">Retry</button></div>}<BackupHeader onCreate={createBackup}/><BackupStats backups={backups}/><section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-4"><div><h2 className="text-sm font-bold text-gray-900">Backup runs</h2><p className="mt-1 text-xs text-gray-500">Newest database backup runs appear first.</p></div><span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand">Server backups</span></div><BackupTable backups={backups} onView={setSelected} onDownload={(backup) => void downloadBackup(backup)}/></section><BackupDetailsDrawer backup={selected} onClose={() => setSelected(null)}/></div>;
}
