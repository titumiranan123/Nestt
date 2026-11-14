import { AlertTriangle, ChevronRight, ClipboardCopy, Eye, History, Save, ShieldCheck } from "lucide-react";
import type { DemoRole } from "@/lib/admin-operations-demo";
import { roleLabels } from "@/lib/admin-operations-demo";

type Props = {
  role: DemoRole;
  selectedCount: number;
  totalCount: number;
  changedCount: number;
  riskCount: number;
  isSaving: boolean;
  readOnly: boolean;
  onCopy: () => void;
  onCompare: () => void;
  onViewAuditLog: () => void;
  onSaveChanges: () => void;
  onReset: () => void;
};

export function RoleSummaryPanel({ role, selectedCount, totalCount, changedCount, riskCount, isSaving, readOnly, onCopy, onCompare, onViewAuditLog, onSaveChanges, onReset }: Props) {
  const percent = totalCount ? Math.round(selectedCount / totalCount * 100) : 0;
  return <aside className="xl:sticky xl:top-24 xl:self-start"><div className="rounded-2xl border border-line bg-white p-4 shadow-sm xs:p-5">
    <div className="mb-5 flex items-start gap-3 border-b border-line pb-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><ShieldCheck size={23}/></span><div><h2 className="text-base font-bold text-gray-950">{roleLabels[role]} role summary</h2><p className="mt-1 text-xs leading-5 text-gray-500">Review access coverage, pending edits, and sensitive actions.</p></div></div>
    <div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Total permissions</p><div className="mt-2 flex items-end gap-2"><span className="text-3xl font-bold tracking-tight text-gray-950">{selectedCount}</span><span className="pb-1 text-lg font-semibold text-gray-500">/ {totalCount}</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }}/></div><p className="mt-2 text-xs font-semibold text-brand">{percent === 100 ? "All permissions configured" : `${percent}% permissions configured`}</p></div>
    <div className="my-5 h-px bg-line"/><div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Changed permissions</p><div className="mt-3 flex w-full items-center justify-between rounded-xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-left"><span><span className="block text-2xl font-bold text-gray-950">{changedCount}</span><span className="text-xs font-semibold text-accent">{changedCount ? "You have unsaved changes" : "No unsaved changes"}</span></span><ChevronRight size={18} className="text-accent"/></div></div>
    <div className="my-5 h-px bg-line"/><div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Risky permissions</p><div className="mt-3 flex items-center justify-between rounded-xl border border-red-100 bg-red-50/60 px-4 py-3"><span><span className="flex items-center gap-2 text-2xl font-bold text-gray-950"><AlertTriangle size={20} className="text-accent"/>{riskCount}</span><span className="text-xs font-semibold text-brand">High impact permissions enabled</span></span><ChevronRight size={18} className="text-brand"/></div></div>
    <div className="my-5 h-px bg-line"/><div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Quick actions</p><div className="mt-3 space-y-1"><QuickAction icon={ClipboardCopy} label="Copy permissions" onClick={onCopy} disabled={readOnly}/><QuickAction icon={Eye} label="Compare roles" onClick={onCompare}/><QuickAction icon={History} label="View audit log" onClick={onViewAuditLog}/></div></div>
    <div className="my-5 h-px bg-line"/><div className="flex gap-2"><button type="button" onClick={onReset} disabled={readOnly || !changedCount} className="h-11 flex-1 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:border-brand/25 hover:text-brand disabled:opacity-40">Reset</button><button type="button" onClick={onSaveChanges} disabled={readOnly || isSaving || !changedCount} className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(241,90,34,.18)] transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16}/>{isSaving ? "Saving..." : "Save Changes"}</button></div><p className="mt-3 text-center text-[11px] text-gray-400">{readOnly ? "Only a Super Admin can edit role permissions." : "Changes are saved to the server for the selected role."}</p>
  </div></aside>;
}

function QuickAction({ icon: Icon, label, onClick, disabled = false }: { icon: typeof Eye; label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 transition hover:bg-brand-soft/55 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"><Icon size={17}/>{label}</button>;
}
