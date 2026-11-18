"use client";

import { useDeferredValue, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { confirmAction } from "@/lib/alert";
import { can } from "@/lib/rbac/can";
import type { DemoStaff } from "@/lib/admin-operations-demo";
import { useCreateStaff, useDeleteStaff, useResetStaffPassword, useStaffList, useUpdateStaff } from "@/features/staff/hooks";
import type { CreateStaffInput, StaffStatus } from "@/features/staff/types";
import { StaffDrawer, type StaffDraft } from "@/components/admin/administration/StaffDrawer";
import { StaffFilters } from "@/components/admin/administration/StaffFilters";
import { StaffHeader } from "@/components/admin/administration/StaffHeader";
import { StaffPasswordDrawer } from "@/components/admin/administration/StaffPasswordDrawer";
import { StaffStats } from "@/components/admin/administration/StaffStats";
import { StaffTable } from "@/components/admin/administration/StaffTable";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";

type Mode = "create" | "edit" | "view" | null;
const emptyDraft = (): StaffDraft => ({ name: "", email: "", password: "", phone: "", role: "SUPPORT", status: "ACTIVE", verified: false });

export function StaffManager() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<DemoStaff["role"] | "ALL">("ALL");
  const [status, setStatus] = useState<StaffStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DemoStaff | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [draft, setDraft] = useState<StaffDraft>(emptyDraft);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const searchTerm = useDeferredValue(search.trim());
  const staffQuery = useStaffList({
    page,
    limit: 20,
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(role !== "ALL" ? { role } : {}),
    ...(status !== "ALL" ? { status } : {}),
  });
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();
  const passwordMutation = useResetStaffPassword();
  const permissions = session?.user.permissions;
  const canCreate = can("staff:create", permissions);
  const canEdit = can("staff:update", permissions);
  const canDelete = can("staff:delete", permissions);
  const staff = staffQuery.data?.items ?? [];
  const summary = staffQuery.data?.summary ?? { total: 0, active: 0, admins: 0, managers: 0 };
  const totalPages = Math.max(1, staffQuery.data?.pages ?? 1);
  const firstItem = staffQuery.data?.total ? (page - 1) * 20 + 1 : 0;
  const lastItem = Math.min(page * 20, staffQuery.data?.total ?? 0);

  const onDraft = (key: keyof StaffDraft, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));
  const openCreate = () => { setSelected(null); setDraft(emptyDraft()); setMode("create"); };
  const openStaff = (item: DemoStaff, nextMode: Exclude<Mode, "create" | null>) => {
    setSelected(item);
    setDraft({ name: item.name, email: item.email, password: "", phone: item.phone, role: item.role, status: item.status, verified: item.verified });
    setMode(nextMode);
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "create") {
      const input: CreateStaffInput = {
        name: draft.name,
        email: draft.email,
        password: draft.password,
        phone: draft.phone,
        role: draft.role === "SUPER_ADMIN" ? "SUPPORT" : draft.role,
        status: draft.status,
        verified: draft.verified,
      };
      createMutation.mutate(input, { onSuccess: () => setMode(null) });
    } else if (mode === "edit" && selected && selected.role !== "SUPER_ADMIN") {
      updateMutation.mutate({
        id: selected.id,
        input: { name: draft.name, email: draft.email, phone: draft.phone, role: draft.role as CreateStaffInput["role"], status: draft.status, verified: draft.verified },
      }, { onSuccess: () => setMode(null) });
    }
  };
  const remove = async (item: DemoStaff) => {
    const confirmed = await confirmAction(
      `Deactivate ${item.name}?`,
      "The account will be disabled and its sessions revoked. Order and audit history will be retained.",
    );
    if (confirmed) deleteMutation.mutate(item.id);
  };
  const resetPassword = (event: FormEvent<HTMLFormElement>, password: string) => {
    event.preventDefault();
    if (!selected || selected.role === "SUPER_ADMIN") return;
    passwordMutation.mutate({ id: selected.id, password }, { onSuccess: () => setPasswordOpen(false) });
  };
  const resetFilters = () => { setSearch(""); setRole("ALL"); setStatus("ALL"); setPage(1); };

  return <div className="animate-fade-up space-y-5">
    <StaffHeader onCreate={openCreate} canCreate={canCreate}/>
    <StaffStats summary={summary}/>
    <StaffFilters search={search} role={role} status={status} onSearch={(value) => { setSearch(value); setPage(1); }} onRole={(value) => { setRole(value as DemoStaff["role"] | "ALL"); setPage(1); }} onStatus={(value) => { setStatus(value as StaffStatus | "ALL"); setPage(1); }} onReset={resetFilters}/>
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-4"><div><h2 className="text-sm font-bold text-gray-900">Staff members</h2><p className="mt-1 text-xs text-gray-500">{staffQuery.data?.total ?? 0} team accounts</p></div>{staffQuery.isFetching && <span className="text-xs text-gray-500">Updating…</span>}</div>
      {staffQuery.isPending ? <AdminLoadingSkeleton kind="table" columns={7} label="Loading staff" /> : <StaffTable staff={staff} onView={(item) => openStaff(item, "view")} onEdit={(item) => openStaff(item, "edit")} onPassword={(item) => { setSelected(item); setPasswordOpen(true); }} onDelete={remove} canEdit={canEdit} canResetPassword={canEdit} canDelete={canDelete}/>}
      <footer className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 text-xs text-gray-500"><span>Showing {firstItem}–{lastItem} of {staffQuery.data?.total ?? 0}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-md border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-40">Next</button></div></footer>
    </section>
    <StaffDrawer open={mode !== null} mode={mode} staff={selected} draft={draft} onDraft={onDraft} onClose={() => setMode(null)} onSave={save} isSaving={createMutation.isPending || updateMutation.isPending}/>
    <StaffPasswordDrawer open={passwordOpen} name={selected?.name ?? ""} onClose={() => setPasswordOpen(false)} onSubmit={resetPassword} isSaving={passwordMutation.isPending}/>
  </div>;
}
