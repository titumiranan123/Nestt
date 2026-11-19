"use client";

import { Plus, Search } from "lucide-react";
import DeliveryBulkUpdateBar from "./BulkUpdateBar";
import DeliveryThanaRow from "./DeliveryThanaRow";
import { Surface, TableState } from "./DeliveryPrimitives";
import type { Thana } from "@/features/delivery/types";

type DeliveryThanaSectionProps = {
  activeDistrictName?: string;
  activeDivisionName?: string;
  allVisibleSelected: boolean;
  bulkDeliverable: string;
  busy: boolean;
  canEdit: boolean;
  bulkZone: string;
  deliverableFilter: string;
  onAddThana: () => void;
  onApplyBulkUpdate: () => void;
  onBulkDeliverableChange: (value: string) => void;
  onBulkZoneChange: (value: string) => void;
  onDeliverableFilterChange: (value: string) => void;
  onEditThana: (thana: Thana) => void;
  onDeleteThana: (thana: Thana) => void;
  onSearchChange: (value: string) => void;
  onSelectAllToggle: () => void;
  onToggleThanaDeliverable: (thana: Thana) => void;
  onToggleThanaSelection: (id: string) => void;
  onZoneFilterChange: (value: string) => void;
  search: string;
  selectedDistrictId: string;
  selectedThanas: Set<string>;
  selectedThanasCount: number;
  thanaCount: number;
  thanaLoading: boolean;
  thanas: Thana[];
  zoneFilter: string;
};

export default function DeliveryThanaSection({
  activeDistrictName,
  activeDivisionName,
  allVisibleSelected,
  bulkDeliverable,
  bulkZone,
  busy,
  canEdit,
  deliverableFilter,
  onAddThana,
  onApplyBulkUpdate,
  onBulkDeliverableChange,
  onBulkZoneChange,
  onDeliverableFilterChange,
  onEditThana,
  onDeleteThana,
  onSearchChange,
  onSelectAllToggle,
  onToggleThanaDeliverable,
  onToggleThanaSelection,
  onZoneFilterChange,
  search,
  selectedDistrictId,
  selectedThanas,
  selectedThanasCount,
  thanaCount,
  thanaLoading,
  thanas,
  zoneFilter,
}: DeliveryThanaSectionProps) {
  return (
    <Surface className="@container flex h-142.5 min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="border-b border-[var(--admin-surface-border)] p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Thana Control
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">
              {activeDistrictName
                ? `${activeDistrictName} Thanas`
                : "Select a district"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update zone, fee override, free threshold, and status.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-secondary/20 px-4 text-sm font-semibold text-secondary transition hover:bg-secondary/5 disabled:opacity-50"
            disabled={!canEdit || busy || !selectedDistrictId}
            type="button"
            onClick={onAddThana}
          >
            <Plus size={15} /> Add Thana
          </button>
        </div>

        <div className="mt-4 grid gap-2 @min-[36rem]:grid-cols-[minmax(210px,1fr)_160px_160px]">
          <label className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
            <input
              aria-label="Search thana"
              className="h-10 w-full rounded-xl border border-[var(--input-border)] bg-white pl-10 pr-3 text-sm outline-none placeholder:text-[var(--input-placeholder)] focus:border-secondary"
              placeholder="Search thana..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter by delivery zone"
            className="h-10 rounded-xl border border-[var(--input-border)] bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-secondary"
            value={zoneFilter}
            onChange={(event) => onZoneFilterChange(event.target.value)}
          >
            <option value="">All zones</option>
            <option value="INSIDE_DHAKA">Inside Dhaka</option>
            <option value="OUTSIDE_DHAKA">Outside Dhaka</option>
          </select>
          <select
            aria-label="Filter by deliverability"
            className="h-10 rounded-xl border border-[var(--input-border)] bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-secondary"
            value={deliverableFilter}
            onChange={(event) => onDeliverableFilterChange(event.target.value)}
          >
            <option value="">All deliverability</option>
            <option value="true">Deliverable</option>
            <option value="false">Blocked</option>
          </select>
        </div>
      </div>

      <DeliveryBulkUpdateBar
        count={selectedThanasCount}
        bulkZone={bulkZone}
        bulkDeliverable={bulkDeliverable}
        disabled={!canEdit || busy}
        onZoneChange={onBulkZoneChange}
        onDeliverableChange={onBulkDeliverableChange}
        onApply={onApplyBulkUpdate}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-207.5 border-collapse text-left">
          <thead>
            <tr className="border-b  border-(--border-default)  bg-secondary/5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-12 px-4 py-3">
                <input
                  aria-label="Select all visible thanas"
                  checked={allVisibleSelected}
                  className="size-4 accent-secondary"
                  disabled={!canEdit || busy || !thanas.length}
                  type="checkbox"
                  onChange={onSelectAllToggle}
                />
              </th>
              <th className="px-4 py-3">Thana</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Custom fee</th>
              <th className="px-4 py-3">Free above</th>
              <th className="px-4 py-3">Deliverable</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {thanaLoading ? (
              <TableState text="Loading thanas..." />
            ) : thanaCount ? (
              thanas.map((thana) => (
                <DeliveryThanaRow
                  key={thana.id}
                  activeDistrictName={activeDistrictName}
                  activeDivisionName={activeDivisionName}
                  canEdit={canEdit && !busy}
                  isSelected={selectedThanas.has(thana.id)}
                  onEdit={() => onEditThana(thana)}
                  onDelete={() => onDeleteThana(thana)}
                  onSelect={() => onToggleThanaSelection(thana.id)}
                  onToggleDeliverable={() => onToggleThanaDeliverable(thana)}
                  thana={thana}
                />
              ))
            ) : (
              <TableState text="No thanas found for this selection." />
            )}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
