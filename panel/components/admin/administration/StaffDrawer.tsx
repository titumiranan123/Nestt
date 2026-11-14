import type { FormEvent, ReactNode } from "react";
import { Save, ShieldCheck } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import type { DemoStaff } from "@/lib/admin-operations-demo";

export type StaffDraft = Pick<DemoStaff, "name" | "email" | "phone" | "role" | "status" | "verified"> & { password: string };
const input = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

type Props = {
  open: boolean;
  mode: "create" | "edit" | "view" | null;
  staff: DemoStaff | null;
  draft: StaffDraft;
  onDraft: (key: keyof StaffDraft, value: string | boolean) => void;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
};

export function StaffDrawer({ open, mode, staff, draft, onDraft, onClose, onSave, isSaving }: Props) {
  const readOnly = mode === "view";
  return <AdminDrawer open={open} onClose={onClose} title={mode === "create" ? "Create staff account" : mode === "edit" ? "Edit staff profile" : "Staff profile"} description={staff ? `${staff.id} · Joined ${new Date(staff.joinedAt).toLocaleDateString()}` : "Create a team account with a role and initial password."}>
    <form onSubmit={onSave} className="space-y-4 p-5 sm:p-6">
      <Field title="Full name"><input required maxLength={255} disabled={readOnly || isSaving} className={input} value={draft.name} onChange={(event) => onDraft("name", event.target.value)}/></Field>
      <Field title="Email address"><input required type="email" disabled={readOnly || isSaving} className={input} value={draft.email} onChange={(event) => onDraft("email", event.target.value)}/></Field>
      <Field title="Phone number (E.164)"><input disabled={readOnly || isSaving} className={input} value={draft.phone} onChange={(event) => onDraft("phone", event.target.value)} placeholder="+8801…"/></Field>
      {mode === "create" && <Field title="Initial password (12+ characters)"><input required minLength={12} maxLength={128} type="password" autoComplete="new-password" disabled={isSaving} className={input} value={draft.password} onChange={(event) => onDraft("password", event.target.value)}/></Field>}
      <Field title="Role"><select disabled={readOnly || isSaving || staff?.role === "SUPER_ADMIN"} className={input} value={draft.role} onChange={(event) => onDraft("role", event.target.value)}><option value="ADMIN">Admin</option><option value="MANAGER">Manager</option><option value="SUPPORT">Support</option>{draft.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}</select></Field>
      <Field title="Account status"><select disabled={readOnly || isSaving || staff?.role === "SUPER_ADMIN"} className={input} value={draft.status} onChange={(event) => onDraft("status", event.target.value)}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></Field>
      <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand"/>Email verified</span><input type="checkbox" disabled={readOnly || isSaving} checked={draft.verified} onChange={(event) => onDraft("verified", event.target.checked)} className="size-4 accent-brand"/></label>
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={onClose} disabled={isSaving} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600">{readOnly ? "Close" : "Cancel"}</button>{!readOnly && <button disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"><Save size={15}/>{isSaving ? "Saving…" : mode === "create" ? "Create staff" : "Save changes"}</button>}</div>
    </form>
  </AdminDrawer>;
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-700">{title}</span>{children}</label>;
}
