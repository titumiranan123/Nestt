"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { permissionActions, permissionResources, type DemoRole, type PermissionAction } from "@/lib/admin-operations-demo";
import { useAccessRoles, useUpdateRolePermissions } from "@/features/access/hooks";
import type { EditableRole } from "@/features/access/types";
import { PermissionFilters } from "@/components/admin/access/PermissionFilters";
import { PermissionMatrix } from "@/components/admin/access/PermissionMatrix";
import { RoleCards } from "@/components/admin/access/RoleCards";
import { RoleSummaryPanel } from "@/components/admin/access/RoleSummaryPanel";
import { RolePermissionsHeader } from "@/components/admin/access/RolePermissionsHeader";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";

type PermissionMap = Record<DemoRole, string[]>;
const emptyPermissionMap = (): PermissionMap => ({ SUPER_ADMIN: [], ADMIN: [], MANAGER: [], SUPPORT: [] });

export function RolePermissionManager() {
  const router = useRouter();
  const { data: session } = useSession();
  const rolesQuery = useAccessRoles();
  const saveMutation = useUpdateRolePermissions();
  const [activeRole, setActiveRole] = useState<DemoRole>("ADMIN");
  const [permissions, setPermissions] = useState<PermissionMap>(emptyPermissionMap);
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [expandedResource, setExpandedResource] = useState<string | null>("Products");
  const canEdit = session?.user.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!rolesQuery.data) return;
    const next = emptyPermissionMap();
    for (const entry of rolesQuery.data.roles) next[entry.role] = [...entry.permissions];
    setPermissions(next);
  }, [rolesQuery.data]);

  const catalogKeys = useMemo(() => rolesQuery.data?.permissions.map(({ key }) => key) ?? [], [rolesQuery.data]);
  const currentPermissions = permissions[activeRole];
  const savedPermissions = rolesQuery.data?.roles.find(({ role }) => role === activeRole)?.permissions ?? [];
  const changedCount = catalogKeys.reduce(
    (count, key) => count + Number(currentPermissions.includes(key) !== savedPermissions.includes(key)),
    0,
  );
  const resources = useMemo(() => {
    const present = new Set(rolesQuery.data?.permissions.map(({ resource }) => resource.toLowerCase()) ?? []);
    return permissionResources.filter((resource) => present.has(resource.toLowerCase()));
  }, [rolesQuery.data]);
  const actions = useMemo(() => {
    const present = new Set(rolesQuery.data?.permissions.map(({ action }) => action) ?? []);
    return permissionActions.filter((action) => present.has(action)) as PermissionAction[];
  }, [rolesQuery.data]);
  const visibleResources = resources.filter((resource) =>
    (resourceFilter === "ALL" || resource === resourceFilter) &&
    `${resource} ${resource.toLowerCase()}:*`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const visibleActions = actionFilter === "ALL" ? actions : actions.filter((action) => action === actionFilter);
  const roleCounts = Object.fromEntries(
    Object.entries(permissions).map(([role, list]) => [role, list.filter((key) => catalogKeys.includes(key)).length]),
  ) as Record<DemoRole, number>;
  const riskCount = currentPermissions.filter((permission) =>
    permission.endsWith(":delete") || permission.endsWith(":assign"),
  ).length;

  const togglePermission = (permission: string) => {
    if (!canEdit) return;
    setPermissions((current) => ({
      ...current,
      [activeRole]: current[activeRole].includes(permission)
        ? current[activeRole].filter((item) => item !== permission)
        : [...current[activeRole], permission],
    }));
  };
  const resetFilters = () => {
    setSearch("");
    setResourceFilter("ALL");
    setActionFilter("ALL");
  };
  const resetSaved = () => setPermissions((current) => ({ ...current, [activeRole]: [...savedPermissions] }));
  const copyAdmin = () => {
    if (!canEdit || activeRole === "ADMIN") return;
    setPermissions((current) => ({ ...current, [activeRole]: [...current.ADMIN] }));
  };
  const savePermissions = () => {
    if (!canEdit || activeRole === "SUPER_ADMIN" || !changedCount) return;
    saveMutation.mutate({ role: activeRole as EditableRole, permissions: currentPermissions });
  };

  if (rolesQuery.isPending) {
    return <AdminLoadingSkeleton kind="page" label="Loading role permissions" />;
  }
  if (rolesQuery.isError || !rolesQuery.data) {
    return <section className="rounded-xl border border-red-200 bg-white p-6"><h1 className="text-lg font-bold text-gray-900">Could not load access control</h1><p className="mt-2 text-sm text-gray-600">Check that permissions are seeded and your account has access.</p><button type="button" onClick={() => void rolesQuery.refetch()} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Try again</button></section>;
  }

  return (
    <div className="animate-fade-up grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        {!canEdit && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Read-only access. Only a Super Admin can change role permissions.</p>}
        <RolePermissionsHeader changedCount={canEdit ? changedCount : 0} canEdit={canEdit} onReset={resetSaved} onSave={savePermissions}/>
        <RoleCards activeRole={activeRole} roleCounts={roleCounts} total={catalogKeys.length} onSelect={(role) => { setActiveRole(role); setExpandedResource(null); }}/>
        <PermissionFilters search={search} resource={resourceFilter} action={actionFilter} resources={resources} actions={actions} onSearch={setSearch} onResource={setResourceFilter} onAction={setActionFilter} onReset={resetFilters}/>
        <PermissionMatrix resources={visibleResources} actions={visibleActions} role={activeRole} permissions={currentPermissions} onToggle={togglePermission} expandedResource={expandedResource} onExpand={(resource) => setExpandedResource((current) => current === resource ? null : resource)} readOnly={!canEdit}/>
      </div>
      <RoleSummaryPanel role={activeRole} selectedCount={roleCounts[activeRole]} totalCount={catalogKeys.length} changedCount={canEdit ? changedCount : 0} riskCount={riskCount} isSaving={saveMutation.isPending} readOnly={!canEdit} onCopy={copyAdmin} onCompare={() => undefined} onViewAuditLog={() => router.push("/admin/audit-logs")} onSaveChanges={savePermissions} onReset={resetSaved}/>
    </div>
  );
}
