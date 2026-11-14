"use client";

import { useMemo, useState, type FormEvent } from "react";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { demoCustomers, type CustomerStatus, type DemoCustomer } from "@/lib/admin-operations-demo";
import { CustomerDrawer } from "@/components/admin/customers/CustomerDrawer";
import { CustomerExportDrawer } from "@/components/admin/customers/CustomerExportDrawer";
import { CustomerFilters } from "@/components/admin/customers/CustomerFilters";
import { CustomersHeader } from "@/components/admin/customers/CustomersHeader";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { CustomerStats } from "@/components/admin/customers/CustomerStats";
import { CustomerTable } from "@/components/admin/customers/CustomerTable";

type DrawerMode = "create" | "edit" | "view" | null;
type Draft = Pick<DemoCustomer, "name" | "email" | "phone" | "location" | "isEmailVerified" | "isPhoneVerified">;
const emptyDraft = (): Draft => ({ name: "", email: "", phone: "", location: "", isEmailVerified: false, isPhoneVerified: false });

export function CustomersManager() {
  const [customers, setCustomers] = useState<DemoCustomer[]>(() => demoCustomers.map((item) => ({ ...item })));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [verification, setVerification] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selected, setSelected] = useState<DemoCustomer | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftStatus, setDraftStatus] = useState<CustomerStatus>("ACTIVE");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const pageSize = 6;
  const filtered = useMemo(() => customers.filter((item) => {
    const query = search.toLowerCase().trim();
    return (!query || `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(query)) && (status === "ALL" || item.status === status) && (verification === "ALL" || (verification === "VERIFIED" ? item.isEmailVerified : !item.isEmailVerified)) && (!from || item.joinedAt >= from) && (!to || item.joinedAt <= to);
  }), [customers, search, status, verification, from, to]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const updateDraft = (key: keyof Draft, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));

  const startCreate = () => { setSelected(null); setDraft(emptyDraft()); setDraftStatus("ACTIVE"); setDrawerMode("create"); };
  const openRecord = (item: DemoCustomer, mode: Exclude<DrawerMode, "create" | null>) => { setSelected(item); setDraft({ name: item.name, email: item.email, phone: item.phone, location: item.location, isEmailVerified: item.isEmailVerified, isPhoneVerified: item.isPhoneVerified }); setDraftStatus(item.status); setDrawerMode(mode); };
  const closeDrawer = () => setDrawerMode(null);
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (drawerMode === "create") {
      const id = `CUS-${String(Date.now()).slice(-4)}`;
      setCustomers((current) => [{ ...draft, id, orders: 0, reviews: 0, status: draftStatus, joinedAt: new Date().toISOString().slice(0, 10) }, ...current]);
    } else if (selected) {
      setCustomers((current) => current.map((item) => item.id === selected.id ? { ...item, ...draft, status: draftStatus } : item));
    }
    closeDrawer();
    void showAdminNotice("Customer saved", "Changes are temporary and reset when the page reloads.", "success");
  };
  const toggleStatus = (item: DemoCustomer) => {
    const next: CustomerStatus = item.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setCustomers((current) => current.map((row) => row.id === item.id ? { ...row, status: next } : row));
    void showAdminNotice("Customer status updated", `${item.name} is now ${next.toLowerCase()}.`, "success");
  };
  const remove = async (item: DemoCustomer) => {
    if (!await confirmAdminAction(`Remove ${item.name}?`, "This only deletes the customer from the local demo data.")) return;
    setCustomers((current) => current.filter((row) => row.id !== item.id));
    if (selected?.id === item.id) { setSelected(null); setDrawerMode(null); }
  };
  const exportCsv = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const records = customers.filter((item) => (!exportFrom || item.joinedAt >= exportFrom) && (!exportTo || item.joinedAt <= exportTo));
    const csv = ["id,name,email,phone,status,joined", ...records.map((item) => [item.id, item.name, item.email, item.phone, item.status, item.joinedAt].map((value) => `"${value.replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "nestt-customers.csv"; anchor.click(); URL.revokeObjectURL(url); setExportOpen(false);
  };
  const reset = () => { setSearch(""); setStatus("ALL"); setVerification("ALL"); setFrom(""); setTo(""); setPage(1); };

  return <div className="animate-fade-up space-y-5"><CustomersHeader onCreate={startCreate} onExport={() => setExportOpen(true)}/><CustomerStats customers={customers}/><CustomerFilters search={search} status={status} verification={verification} from={from} to={to} onSearch={(value) => { setSearch(value); setPage(1); }} onStatus={(value) => { setStatus(value); setPage(1); }} onVerification={(value) => { setVerification(value); setPage(1); }} onFrom={(value)=>{setFrom(value);setPage(1);}} onTo={(value)=>{setTo(value);setPage(1);}} onReset={reset}/><section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"><div className="flex flex-col gap-1 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-gray-950">Customers</h2><p className="text-sm text-gray-500">{filtered.length.toLocaleString()} customer profiles</p></div><span className="text-xs font-semibold text-brand">Local demo data</span></div><CustomerTable customers={visible} onView={(item) => openRecord(item, "view")} onEdit={(item) => openRecord(item, "edit")} onToggle={toggleStatus} onDelete={remove}/><TablePagination total={filtered.length} page={page} pageSize={pageSize} pageCount={pages} itemLabel="customers" onPage={setPage}/></section><CustomerDrawer open={drawerMode !== null} mode={drawerMode} customer={selected} draft={draft} status={draftStatus} onDraftChange={updateDraft} onStatusChange={setDraftStatus} onClose={closeDrawer} onSave={save} onDelete={()=>selected&&void remove(selected)}/><CustomerExportDrawer open={exportOpen} from={exportFrom} to={exportTo} onFrom={setExportFrom} onTo={setExportTo} onClose={() => setExportOpen(false)} onSubmit={exportCsv}/></div>;
}
