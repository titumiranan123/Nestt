"use client";

import { useState } from "react";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { demoBackups, type DemoBackup } from "@/lib/admin-operations-demo";
import { BackupDetailsDrawer } from "@/components/admin/administration/BackupDetailsDrawer";
import { BackupHeader } from "@/components/admin/administration/BackupHeader";
import { BackupStats } from "@/components/admin/administration/BackupStats";
import { BackupTable } from "@/components/admin/administration/BackupTable";

export function BackupManager() {
  const [backups, setBackups] = useState<DemoBackup[]>(() => demoBackups.map((item) => ({ ...item })));
  const [selected, setSelected] = useState<DemoBackup | null>(null);
  const createDemo = async () => {
    if (!await confirmAdminAction("Create a demo backup record?", "This only adds a temporary sample row. It will not connect to a database or cloud storage.")) return;
    const now = new Date();
    const stamp = now.toISOString().slice(0, 16).replaceAll(":", "-");
    const created: DemoBackup = { id: `BK-${String(Date.now()).slice(-4)}`, filename: `nestt-demo-${stamp}.sql.gz`, status: "SUCCESS", size: "18.6 MB", startedAt: now.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }), finishedAt: now.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }), type: "Manual" };
    setBackups((current) => [created, ...current]);
    void showAdminNotice("Demo backup added", "A sample record was added to this page session.", "success");
  };
  const downloadManifest = (backup: DemoBackup) => {
    const text = `Nestt admin demo backup manifest\nID: ${backup.id}\nFile: ${backup.filename}\nStatus: ${backup.status}\nSize: ${backup.size}\nType: ${backup.type}\n\nThis is a UI demo record. No database dump is included.`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${backup.id}-manifest.txt`; anchor.click(); URL.revokeObjectURL(url);
  };
  return <div className="animate-fade-up space-y-5"><BackupHeader onCreate={createDemo}/><BackupStats backups={backups}/><section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-4"><div><h2 className="text-sm font-bold text-gray-900">Backup runs</h2><p className="mt-1 text-xs text-gray-500">Newest runs appear first. Sample history is kept for this session.</p></div><span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand">Local demo data</span></div><BackupTable backups={backups} onView={setSelected} onDownload={downloadManifest}/></section><BackupDetailsDrawer backup={selected} onClose={() => setSelected(null)}/></div>;
}
