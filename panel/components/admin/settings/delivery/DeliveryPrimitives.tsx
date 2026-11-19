"use client";

import { classes } from "./format";
import { Check, ChevronRight, Edit3, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { DeliveryZone } from "@/features/delivery/types";
import { zoneLabels } from "@/features/delivery/types";

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classes(
        "rounded-2xl border border-(--border-default) bg-[var(--bg-surface-strong)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Surface className="p-4 min-[30rem]:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold leading-none text-gray-950">
            {value.toLocaleString("en-BD")}
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          {icon}
        </div>
      </div>
    </Surface>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--admin-surface-border)] p-4">
      <div>
        <h2 className="font-semibold text-gray-950">{title}</h2>
        <p className="mt-0.5 text-xs font-medium text-gray-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function HierarchyButton({
  active,
  canEdit,
  label,
  count,
  meta,
  onClick,
  onEdit,
  onDelete,
}: {
  active: boolean;
  canEdit: boolean;
  label: string;
  count: number;
  meta: string;
  onClick: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={classes(
        "group mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition",
        active
          ? "bg-secondary/10 text-secondary"
          : "text-gray-700 hover:bg-secondary/5",
      )}
    >
      <button type="button" aria-pressed={active} onClick={onClick} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{label}</span>
        <span className="block text-xs font-medium text-gray-500">
          {count.toLocaleString("en-BD")} {meta}
        </span>
      </button>
      <span className="ml-2 flex shrink-0 items-center gap-1">
        <button
          aria-label={`Edit ${label}`}
          className="inline-flex size-7 items-center justify-center text-gray-400 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-white hover:text-secondary disabled:opacity-40 [@media(hover:none)]:opacity-100"
          disabled={!canEdit}
          type="button"
          onClick={onEdit}
        >
          <Edit3 size={13} />
        </button>
        {onDelete ? (
          <button
            aria-label={`Delete ${label}`}
            className="inline-flex size-7 items-center justify-center text-gray-400 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-white hover:text-red-600 disabled:opacity-40 [@media(hover:none)]:opacity-100"
            disabled={!canEdit}
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={13} />
          </button>
        ) : null}
        <ChevronRight size={14} />
      </span>
    </div>
  );
}

export function IconButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-secondary/20 text-secondary transition hover:bg-secondary/5 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function TogglePill({
  checked,
  disabled,
  onClick,
}: {
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={classes(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition",
        checked
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-red-50 text-red-700 hover:bg-red-100",
      )}
      aria-pressed={checked}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <Check size={12} />
      {checked ? "Deliverable" : "Blocked"}
    </button>
  );
}

export function ZoneBadge({ zone }: { zone: DeliveryZone }) {
  return (
    <span
      className={classes(
        "inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold",
        zone === "INSIDE_DHAKA"
          ? "bg-secondary/10 text-secondary"
          : "bg-blue-50 text-blue-700",
      )}
    >
      {zoneLabels[zone]}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={classes(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function FeeBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-(--border-default) bg-secondary/5 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="text-xs font-semibold text-gray-950">{value}</p>
    </div>
  );
}

export function TableState({ text }: { text: string }) {
  return (
    <tr>
      <td
        colSpan={7}
        className="px-4 py-12 text-center text-sm font-medium text-gray-500"
      >
        {text}
      </td>
    </tr>
  );
}

export function SmallLoading() {
  return (
    <div className="py-7 text-center text-sm text-gray-500">Loading...</div>
  );
}
export function EmptyText({ text }: { text: string }) {
  return <div className="p-4 text-center text-sm text-gray-500">{text}</div>;
}
