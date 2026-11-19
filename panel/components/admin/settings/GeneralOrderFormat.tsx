import { Hash, Info } from "lucide-react";
import { settingsInput, settingsLabel } from "./SettingsPanel";

export type OrderFormatDraft = { prefix: string; suffix: string; startNumber: string };

type GeneralOrderFormatProps = OrderFormatDraft & {
  nextNumber?: string;
  configured: boolean;
  disabled: boolean;
  onChange: (key: keyof OrderFormatDraft, value: string) => void;
  onUseDefault: () => void;
};

export default function GeneralOrderFormat({ prefix, suffix, startNumber, nextNumber, configured, disabled, onChange, onUseDefault }: GeneralOrderFormatProps) {
  const codePartPattern = String.raw`[A-Za-z0-9_\-]*`;
  const previewNumber = nextNumber && Number(nextNumber) > Number(startNumber) ? nextNumber : startNumber;

  return (
    <section className="px-5 py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><Hash size={17} /></span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Order ID Format</h3>
            <p className="mt-1 text-xs text-gray-500">Set the prefix, starting number, and suffix used for new orders.</p>
          </div>
        </div>
        {!configured && !disabled && (
          <button type="button" onClick={onUseDefault} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-soft">
            Use suggested format
          </button>
        )}
      </div>
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className={settingsLabel}>Prefix</span>
          <input className={settingsInput} value={prefix} onChange={(event) => onChange("prefix", event.target.value)} maxLength={10} pattern={codePartPattern} placeholder="NST-" />
        </label>
        <label>
          <span className={settingsLabel}>Starting number</span>
          <input className={settingsInput} type="number" min={1} max={999_999_999} step={1} required value={startNumber} onChange={(event) => onChange("startNumber", event.target.value)} />
        </label>
        <label>
          <span className={settingsLabel}>Suffix</span>
          <input className={settingsInput} value={suffix} onChange={(event) => onChange("suffix", event.target.value)} maxLength={10} pattern={codePartPattern} placeholder="Optional" />
        </label>
      </fieldset>
      <p className="mt-2 text-xs text-gray-500">Use up to 10 letters, digits, hyphens or underscores in the prefix and suffix.</p>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-soft/70 px-3.5 py-3 text-xs text-brand">
        <Info size={15} className="mt-0.5 shrink-0" />
        <p>Order ID preview <strong>{prefix}{previewNumber}{suffix}</strong></p>
      </div>
    </section>
  );
}
