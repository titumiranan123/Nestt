import { Edit3, Truck } from "lucide-react";
import { zoneLabels, type ZoneConfig } from "@/features/delivery/types";
import { money } from "./format";
import { FeeBox, StatusBadge, Surface } from "./DeliveryPrimitives";

export default function ZoneCard({ config, canEdit, onEdit }: { config: ZoneConfig; canEdit: boolean; onEdit: () => void }) {
  return (
    <Surface className="p-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Truck size={19} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{zoneLabels[config.zone]}</h2>
              <StatusBadge active={config.isActive} />
              {config.isFree && <span className="bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">Always free</span>}
            </div>
            <p className="mt-1 text-xs text-gray-500">Default applies when thana custom fee is empty.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FeeBox label="Flat fee" value={money(config.flatFee)} />
          <FeeBox label="Free over" value={money(config.minOrderFree, "-")} />
          <button
            type="button"
            aria-label={`Edit ${zoneLabels[config.zone]} delivery settings`}
            disabled={!canEdit}
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-secondary/20 px-3 text-xs font-semibold text-secondary disabled:opacity-50"
          >
            <Edit3 size={14} />Edit
          </button>
        </div>
      </div>
    </Surface>
  );
}
