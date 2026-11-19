"use client";

import { Edit3, Trash2 } from "lucide-react";
import { TogglePill, ZoneBadge } from "./DeliveryPrimitives";
import type { Thana } from "@/features/delivery/types";
import { money } from "./format";

type DeliveryThanaRowProps = {
  thana: Thana;
  activeDistrictName?: string;
  activeDivisionName?: string;
  canEdit: boolean;
  isSelected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onToggleDeliverable: () => void;
};

export default function DeliveryThanaRow({
  thana,
  activeDistrictName,
  activeDivisionName,
  canEdit,
  isSelected,
  onEdit,
  onDelete,
  onSelect,
  onToggleDeliverable,
}: DeliveryThanaRowProps) {
  return (
    <tr className="bg-white hover:bg-secondary/5">
      <td className="px-4 py-3">
        <input
          aria-label={`Select ${thana.name}`}
          checked={isSelected}
          className="size-4 accent-secondary"
          disabled={!canEdit}
          type="checkbox"
          onChange={onSelect}
        />
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-950">{thana.name}</p>
        <p className="text-xs font-medium text-gray-500">
          {thana.district?.name ?? activeDistrictName ?? "-"},{" "}
          {thana.district?.division.name ?? activeDivisionName ?? "-"}
        </p>
      </td>
      <td className="px-4 py-3">
        <ZoneBadge zone={thana.deliveryZone} />
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
        {money(thana.shippingFee, "-")}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
        {money(thana.freeDeliveryAbove, "-")}
      </td>
      <td className="px-4 py-3">
        <TogglePill
          checked={thana.isDeliverable}
          disabled={!canEdit}
          onClick={onToggleDeliverable}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-2">
          <button
            aria-label={`Edit ${thana.name}`}
            disabled={!canEdit}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-(--border-default) text-gray-500 transition hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary"
            type="button"
            onClick={onEdit}
          >
            <Edit3 size={14} />
          </button>
          <button
            aria-label={`Delete ${thana.name}`}
            disabled={!canEdit}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-(--border-default) text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
