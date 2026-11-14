"use client";

import { useMemo, useState } from "react";
import type { DemoAuditLog } from "@/lib/admin-operations-demo";
import { demoAuditLogs } from "@/lib/admin-operations-demo";
import { AuditFilters } from "@/components/admin/administration/AuditFilters";
import { AuditHeader } from "@/components/admin/administration/AuditHeader";
import { AuditLogDrawer } from "@/components/admin/administration/AuditLogDrawer";
import { AuditLogTable } from "@/components/admin/administration/AuditLogTable";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { AuditStats } from "@/components/admin/administration/AuditStats";

export function AuditLogsManager() {
  const [logs] = useState<DemoAuditLog[]>(() => demoAuditLogs.map((item) => ({ ...item })));
  const [search, setSearch] = useState("");
  const [actor, setActor] = useState("STAFF");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DemoAuditLog | null>(null);
  const pageSize = 5;
  const filtered = useMemo(() => logs.filter((item) => (!search || `${item.actor} ${item.action} ${item.resource} ${item.ip}`.toLowerCase().includes(search.toLowerCase())) && (actor === "ALL" || (actor === "GUEST" ? item.role === "GUEST" : item.role !== "GUEST")) && (status === "ALL" || item.status === status)), [logs, search, actor, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const reset = () => { setSearch(""); setActor("ALL"); setStatus("ALL"); setPage(1); };
  return <div className="animate-fade-up space-y-5"><AuditHeader/><AuditStats logs={logs}/><AuditFilters search={search} actor={actor} status={status} onSearch={(value) => { setSearch(value); setPage(1); }} onActor={(value) => { setActor(value); setPage(1); }} onStatus={(value) => { setStatus(value); setPage(1); }} onReset={reset}/><section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-200 px-4 py-3"><h2 className="text-sm font-bold text-gray-900">Activity history</h2><p className="mt-1 text-xs text-gray-500">Sample staff, customer, and system events.</p></div><AuditLogTable logs={visible} onView={setSelected}/><TablePagination total={filtered.length} page={page} pageSize={pageSize} pageCount={pages} itemLabel="events" onPage={setPage}/></section><AuditLogDrawer log={selected} onClose={() => setSelected(null)}/></div>;
}
