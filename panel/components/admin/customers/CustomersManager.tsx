"use client";

import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { confirmAdminAction } from "@/lib/admin-swal";
import { getErrorMessage } from "@/lib/api/errors";
import { can } from "@/lib/rbac/can";
import { useCustomerActions, useCustomers } from "@/features/customers/hooks";
import type { Customer, CustomerDraft, CustomerStatus } from "@/features/customers/types";
import { CustomerDrawer } from "@/components/admin/customers/CustomerDrawer";
import { CustomerExportDrawer } from "@/components/admin/customers/CustomerExportDrawer";
import { CustomerFilters } from "@/components/admin/customers/CustomerFilters";
import { CustomersHeader } from "@/components/admin/customers/CustomersHeader";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { CustomerStats } from "@/components/admin/customers/CustomerStats";
import { CustomerTable } from "@/components/admin/customers/CustomerTable";

type DrawerMode = "create" | "edit" | "view" | null;
const emptyDraft: CustomerDraft = { name: "", email: "", phone: "", location: "", isEmailVerified: false, isPhoneVerified: false };
const pageSize = 6;

function confirmStatusChange(customer: Customer, status: CustomerStatus) {
  const titles: Record<CustomerStatus, string> = {
    ACTIVE: "Activate customer?",
    SUSPENDED: "Suspend customer?",
    BANNED: "Ban customer?",
  };
  return confirmAdminAction(titles[status], `The account status for ${customer.name} will be set to ${status.toLowerCase()}.`);
}

export function CustomersManager() {
  const { data: session } = useSession();
  const permissions = session?.user.permissions;
  const canCreate = can("customers:create", permissions);
  const canUpdate = can("customers:update", permissions);
  const canDelete = can("customers:delete", permissions);
  const canExport = can("customers:export", permissions);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [verification, setVerification] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft);
  const [draftStatus, setDraftStatus] = useState<CustomerStatus>("ACTIVE");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  const customers = useCustomers({ search: useDeferredValue(search.trim()), status, verification, from, to, page, limit: pageSize });
  const actions = useCustomerActions();
  const total = customers.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const busy = actions.save.isPending || actions.updateStatus.isPending || actions.remove.isPending;

  useEffect(() => {
    if (customers.data && page > pages) setPage(pages);
  }, [customers.data, page, pages]);

  const updateDraft = (key: keyof CustomerDraft, value: string | boolean) => setDraft((current) => {
    if (key === "email" && value !== current.email) return { ...current, email: String(value), isEmailVerified: false };
    if (key === "phone" && value !== current.phone) return { ...current, phone: String(value), isPhoneVerified: false };
    return { ...current, [key]: value };
  });

  const startCreate = () => {
    setSelected(null);
    setDraft(emptyDraft);
    setDraftStatus("ACTIVE");
    setDrawerMode("create");
  };

  const openRecord = (item: Customer, mode: "edit" | "view") => {
    setSelected(item);
    setDraft({ name: item.name, email: item.email, phone: item.phone, location: item.location, isEmailVerified: item.isEmailVerified, isPhoneVerified: item.isPhoneVerified });
    setDraftStatus(item.status);
    setDrawerMode(mode);
  };

  const closeDrawer = () => setDrawerMode(null);

  const save = async (password: string, avatar: File | null) => {
    const creating = drawerMode === "create";
    if (busy || (creating ? !canCreate : !selected || !canUpdate)) return;
    if (!creating && selected && draftStatus !== selected.status && !await confirmStatusChange(selected, draftStatus)) return;
    actions.save.mutate({
      id: creating ? undefined : selected?.id,
      profile: { ...draft, status: draftStatus, ...(creating ? { password } : {}) },
      avatar,
    }, { onSuccess: closeDrawer });
  };

  const toggleStatus = async (item: Customer) => {
    if (!canUpdate || busy) return;
    const next = item.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!await confirmStatusChange(item, next)) return;
    actions.updateStatus.mutate({ id: item.id, status: next });
  };

  const remove = async (item: Customer) => {
    if (!canDelete || busy) return;
    if (!await confirmAdminAction("Delete customer?", `This disables ${item.name}'s account and removes it from the customer list. Order history is retained.`)) return;
    actions.remove.mutate(item.id, {
      onSuccess: () => { if (selected?.id === item.id) closeDrawer(); },
    });
  };

  const exportCsv = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canExport || actions.exportCsv.isPending) return;
    actions.exportCsv.mutate({ from: exportFrom, to: exportTo }, {
      onSuccess: (file) => {
        const url = URL.createObjectURL(file);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "nestt-customers.csv";
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExportOpen(false);
      },
    });
  };

  const reset = () => { setSearch(""); setStatus("ALL"); setVerification("ALL"); setFrom(""); setTo(""); setPage(1); };
  const emptyMessage = customers.isError ? getErrorMessage(customers.error) : customers.isPending ? "Loading customers…" : undefined;

  return <div className="animate-fade-up space-y-5">
    <CustomersHeader onCreate={startCreate} onExport={() => setExportOpen(true)} canCreate={canCreate} canExport={canExport}/>
    <CustomerStats summary={customers.data?.summary}/>
    <CustomerFilters search={search} status={status} verification={verification} from={from} to={to} onSearch={(value) => { setSearch(value); setPage(1); }} onStatus={(value) => { setStatus(value); setPage(1); }} onVerification={(value) => { setVerification(value); setPage(1); }} onFrom={(value) => { setFrom(value); setPage(1); }} onTo={(value) => { setTo(value); setPage(1); }} onReset={reset}/>
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-bold text-gray-950">Customers</h2><p className="text-sm text-gray-500">{total.toLocaleString()} customer profiles</p></div>
        {customers.isError
          ? <button type="button" className="text-xs font-semibold text-brand" onClick={() => void customers.refetch()}>Retry</button>
          : <span className="text-xs font-semibold text-brand">{customers.isFetching ? "Loading…" : "Customer records"}</span>}
      </div>
      <CustomerTable customers={customers.data?.items ?? []} emptyMessage={emptyMessage} canUpdate={canUpdate && !busy} canDelete={canDelete && !busy} onView={(item) => openRecord(item, "view")} onEdit={(item) => openRecord(item, "edit")} onToggle={toggleStatus} onDelete={remove}/>
      <TablePagination total={total} page={Math.min(page, pages)} pageSize={pageSize} pageCount={pages} itemLabel="customers" onPage={setPage}/>
    </section>
    <CustomerDrawer key={`${drawerMode}-${selected?.id ?? ""}`} open={drawerMode !== null} mode={drawerMode} customer={selected} draft={draft} status={draftStatus} busy={busy} onDraftChange={updateDraft} onStatusChange={setDraftStatus} onClose={closeDrawer} onSave={save} onDelete={canDelete && selected ? () => void remove(selected) : undefined}/>
    <CustomerExportDrawer open={exportOpen} from={exportFrom} to={exportTo} busy={actions.exportCsv.isPending} onFrom={setExportFrom} onTo={setExportTo} onClose={() => setExportOpen(false)} onSubmit={exportCsv}/>
  </div>;
}
