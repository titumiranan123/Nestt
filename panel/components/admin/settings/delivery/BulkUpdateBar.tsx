import { Save, SlidersHorizontal } from "lucide-react";
import { Button } from "./DeliveryForm";

type BulkUpdateBarProps = {
  count: number;
  bulkZone: string;
  bulkDeliverable: string;
  disabled: boolean;
  onZoneChange: (value: string) => void;
  onDeliverableChange: (value: string) => void;
  onApply: () => void;
};

export default function BulkUpdateBar({ count, bulkZone, bulkDeliverable, disabled, onZoneChange, onDeliverableChange, onApply }: BulkUpdateBarProps) {
  if (!count) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-secondary/5 px-4 py-3">
      <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold">
        <SlidersHorizontal size={14} />{count} selected
      </span>
      <select aria-label="Change selected delivery zones" disabled={disabled} value={bulkZone} onChange={(event) => onZoneChange(event.target.value)}>
        <option value="">Change zone...</option>
        <option value="INSIDE_DHAKA">Inside Dhaka</option>
        <option value="OUTSIDE_DHAKA">Outside Dhaka</option>
      </select>
      <select aria-label="Change selected deliverability" disabled={disabled} value={bulkDeliverable} onChange={(event) => onDeliverableChange(event.target.value)}>
        <option value="">Deliverability...</option>
        <option value="true">Deliverable</option>
        <option value="false">Blocked</option>
      </select>
      <Button type="button" disabled={disabled || (!bulkZone && !bulkDeliverable)} onClick={onApply}>
        <Save size={14} />Apply
      </Button>
    </div>
  );
}
