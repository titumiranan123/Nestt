import type { AccessPermission } from "@/features/access/types";
import { PermissionRow } from "@/components/admin/access/PermissionRow";
import { PermissionDetails } from "@/components/admin/access/PermissionDetails";

type Props = {
  resources: string[];
  actions: string[];
  catalog: AccessPermission[];
  permissions: ReadonlySet<string>;
  onToggle: (key: string) => void;
  expandedResource: string | null;
  onExpand: (resource: string) => void;
  readOnly: boolean;
};

export function PermissionMatrix({ resources, actions, catalog, permissions, onToggle, expandedResource, onExpand, readOnly }: Props) {
  const entryFor = (resource: string, action: string) => catalog.find((entry) => entry.resource === resource.toLowerCase() && entry.action === action);
  const detailEntries = expandedResource ? actions.flatMap((action) => {
    const entry = entryFor(expandedResource, action);
    return entry ? [entry] : [];
  }) : [];

  return <>
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-sm">
          <thead><tr className="border-b border-brand/10 bg-brand-soft/40 text-xs font-bold uppercase tracking-[.14em] text-gray-500"><th className="w-[250px] px-5 py-4 text-left">Resource Group</th>{actions.map((action) => <th key={action} className="px-3 py-4 text-center">{action}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#edf0f4]">{resources.map((resource) => <PermissionRow key={resource} resource={resource} actions={actions} entryFor={(action) => entryFor(resource, action)} permissions={permissions} disabled={readOnly} expanded={expandedResource === resource} onExpand={() => onExpand(resource)} onToggle={onToggle}/>)}</tbody>
        </table>
      </div>
      <footer className="border-t border-brand/10 bg-gray-50/70 px-5 py-3 text-[11px] text-gray-500">Select a resource group to inspect its detailed permissions. Save changes to persist them for the selected role.</footer>
    </section>
    {expandedResource && resources.includes(expandedResource) && <PermissionDetails resource={expandedResource} entries={detailEntries} permissions={permissions} onToggle={onToggle} disabled={readOnly}/>}
  </>;
}
