"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAccessRoles, useFetchRoleAudit, useUpdateRolePermissions } from "@/features/access/hooks";
import type { AccessPermission, StaffRole } from "@/features/access/types";
import { can } from "@/lib/rbac/can";
import { getErrorMessage } from "@/lib/api/errors";
import { showAdminNotice } from "@/lib/admin-swal";
import { PermissionFilters } from "@/components/admin/access/PermissionFilters";
import { PermissionMatrix } from "@/components/admin/access/PermissionMatrix";
import { RoleCards } from "@/components/admin/access/RoleCards";
import { RoleSummaryPanel } from "@/components/admin/access/RoleSummaryPanel";
import { RolePermissionsHeader } from "@/components/admin/access/RolePermissionsHeader";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";

const resourceOrder = ["Dashboard", "Products", "Orders", "Customers", "Staff", "Inventory", "Website", "Marketing", "Reports", "Settings"];
const actionOrder = ["read", "create", "update", "delete", "assign", "export", "download"];
const emptyPermissions: string[] = [];
const emptyCatalog: AccessPermission[] = [];

function preferredOrder(values: string[], preferred: string[]) {
  const available = new Set(values);
  return [...preferred.filter((value) => available.delete(value)), ...available];
}

export function RolePermissionManager() {
  const { data: session } = useSession();
  const rolesQuery = useAccessRoles();
  const fetchRoleAudit = useFetchRoleAudit();
  const saveMutation = useUpdateRolePermissions();
  const [activeRole, setActiveRole] = useState<StaffRole>("ADMIN");
  const [drafts, setDrafts] = useState<Partial<Record<StaffRole, string[]>>>({});
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [expandedResource, setExpandedResource] = useState<string | null>("Products");
  const canEdit = session?.user.role === "SUPER_ADMIN" && can("settings:update", session.user.permissions);

  const catalog = rolesQuery.data?.permissions ?? emptyCatalog;
  const grants = rolesQuery.data?.roles;
  const savedFor = (role: StaffRole) => grants?.find((entry) => entry.role === role)?.permissions ?? emptyPermissions;
  const saved = new Set(savedFor(activeRole));
  const current = new Set(drafts[activeRole] ?? saved);
  const changedCount = catalog.filter(({ key }) => current.has(key) !== saved.has(key)).length;
  const resources = preferredOrder(catalog.map(({ resource }) => resource.charAt(0).toUpperCase() + resource.slice(1)), resourceOrder);
  const actions = preferredOrder(catalog.map(({ action }) => action), actionOrder);
  const query = search.trim().toLowerCase();
  const visibleResources = resources.filter((resource) => {
    if (resourceFilter !== "ALL" && resource !== resourceFilter) return false;
    return catalog.some((permission) => permission.resource === resource.toLowerCase() &&
      (actionFilter === "ALL" || permission.action === actionFilter) &&
      `${resource} ${permission.key} ${permission.description ?? ""}`.toLowerCase().includes(query));
  });
  const visibleActions = actionFilter === "ALL" ? actions : actions.filter((action) => action === actionFilter);
  const roleCounts = {
    SUPER_ADMIN: (drafts.SUPER_ADMIN ?? savedFor("SUPER_ADMIN")).length,
    ADMIN: (drafts.ADMIN ?? savedFor("ADMIN")).length,
    MANAGER: (drafts.MANAGER ?? savedFor("MANAGER")).length,
    SUPPORT: (drafts.SUPPORT ?? savedFor("SUPPORT")).length,
  };
  const riskCount = catalog.filter(({ key, action }) => current.has(key) && (action === "delete" || action === "assign")).length;

  const togglePermission = (permission: string) => {
    if (!canEdit || activeRole === "SUPER_ADMIN" || saveMutation.isPending) return;
    setDrafts((previous) => {
      const next = new Set(previous[activeRole] ?? saved);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return { ...previous, [activeRole]: [...next] };
    });
  };
  const resetFilters = () => { setSearch(""); setResourceFilter("ALL"); setActionFilter("ALL"); };
  const resetSaved = () => setDrafts((previous) => ({ ...previous, [activeRole]: undefined }));
  const copyAdmin = () => {
    if (!canEdit || activeRole === "ADMIN" || activeRole === "SUPER_ADMIN" || saveMutation.isPending) return;
    setDrafts((previous) => ({ ...previous, [activeRole]: previous.ADMIN ?? [...savedFor("ADMIN")] }));
  };
  const savePermissions = () => {
    if (!canEdit || activeRole === "SUPER_ADMIN" || !changedCount || saveMutation.isPending) return;
    saveMutation.mutate({ role: activeRole, permissions: [...current] }, {
      onSuccess: (_, { role }) => setDrafts((previous) => ({ ...previous, [role]: undefined })),
    });
  };
  const compareRoles = () => {
    const other = activeRole === "ADMIN" ? "MANAGER" : "ADMIN";
    const otherGrants = new Set(savedFor(other));
    const onlyHere = [...saved].filter((key) => !otherGrants.has(key)).sort();
    const onlyThere = [...otherGrants].filter((key) => !saved.has(key)).sort();
    const title = `${activeRole} and ${other}`;
    const difference = onlyHere.length || onlyThere.length
      ? `Only on ${activeRole} (${onlyHere.length})\n${onlyHere.join(", ") || "None"}\n\nOnly on ${other} (${onlyThere.length})\n${onlyThere.join(", ") || "None"}`
      : "Both roles have the same saved permissions.";
    void showAdminNotice(title, difference);
  };
  const viewAudit = async () => {
    const entries = await fetchRoleAudit(activeRole);
    if (!entries) return;
    const details = entries.map(({ actorEmail, createdAt }) => `${new Date(createdAt).toLocaleString()} · ${actorEmail}`).join("\n");
    void showAdminNotice(`${activeRole} permission history`, details || "No permission changes have been recorded for this role.");
  };

  if (rolesQuery.isPending) {
    return <AdminLoadingSkeleton kind="page" label="Loading role permissions" />;
  }
  if (rolesQuery.isError || !rolesQuery.data) {
    return <section className="rounded-xl border border-red-200 bg-white p-6"><h1 className="text-lg font-bold text-gray-900">Could not load access control</h1><p className="mt-2 text-sm text-gray-600">{getErrorMessage(rolesQuery.error)}</p><button type="button" onClick={() => void rolesQuery.refetch()} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Try again</button></section>;
  }

  return (
    <div className="animate-fade-up grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        {!canEdit && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Read-only access. Only a Super Admin can change role permissions.</p>}
        <RolePermissionsHeader changedCount={canEdit ? changedCount : 0} canEdit={canEdit && !saveMutation.isPending} onReset={resetSaved} onSave={savePermissions}/>
        <RoleCards activeRole={activeRole} roleCounts={roleCounts} total={catalog.length} onSelect={(role) => { setActiveRole(role); setExpandedResource(null); }}/>
        <PermissionFilters search={search} resource={resourceFilter} action={actionFilter} resources={resources} actions={actions} onSearch={setSearch} onResource={setResourceFilter} onAction={setActionFilter} onReset={resetFilters}/>
        <PermissionMatrix resources={visibleResources} actions={visibleActions} catalog={catalog} permissions={current} onToggle={togglePermission} expandedResource={expandedResource} onExpand={(resource) => setExpandedResource((previous) => previous === resource ? null : resource)} readOnly={!canEdit || saveMutation.isPending}/>
      </div>
      <RoleSummaryPanel role={activeRole} selectedCount={roleCounts[activeRole]} totalCount={catalog.length} changedCount={canEdit ? changedCount : 0} riskCount={riskCount} isSaving={saveMutation.isPending} readOnly={!canEdit} onCopy={copyAdmin} onCompare={compareRoles} onViewAuditLog={viewAudit} onSaveChanges={savePermissions} onReset={resetSaved}/>
    </div>
  );
}
