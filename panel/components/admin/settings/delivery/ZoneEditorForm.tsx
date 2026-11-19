"use client"

import type { FormEvent } from "react"
import { Button, DrawerFooter, FormField, FormToggle } from "./DeliveryForm"
import type { ZoneFormState } from "@/features/delivery/types"

type ZoneEditorFormProps = {
  form: ZoneFormState
  isSaving: boolean
  error: string
  onChange: (form: ZoneFormState) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function ZoneEditorForm({
  form,
  isSaving,
  error,
  onChange,
  onClose,
  onSubmit,
}: ZoneEditorFormProps) {
  return (
    <form
      className="delivery-drawer flex min-h-full flex-col"
      aria-busy={isSaving}
      onSubmit={onSubmit}
    >
      <fieldset
        disabled={isSaving}
        className="grid min-w-0 flex-1 content-start gap-4 p-5 sm:grid-cols-2 sm:px-6"
      >
        <FormField label="Flat fee">
          <input
            className="delivery-input"
            min={0}
            step="0.01"
            type="number"
            value={form.flatFee}
            onChange={(event) => onChange({ ...form, flatFee: event.target.value })}
          />
        </FormField>

        <FormField label="Free delivery above (optional)">
          <input
            className="delivery-input"
            min={0}
            step="0.01"
            placeholder="Leave blank to disable"
            type="number"
            value={form.minOrderFree}
            onChange={(event) => onChange({ ...form, minOrderFree: event.target.value })}
          />
        </FormField>

        <FormField label="Minimum ETA days">
          <input
            className="delivery-input"
            min={0}
            placeholder="Optional"
            type="number"
            value={form.estimatedDaysMin}
            onChange={(event) =>
              onChange({ ...form, estimatedDaysMin: event.target.value })
            }
          />
        </FormField>

        <FormField label="Maximum ETA days">
          <input
            className="delivery-input"
            min={0}
            placeholder="Optional"
            type="number"
            value={form.estimatedDaysMax}
            onChange={(event) =>
              onChange({ ...form, estimatedDaysMax: event.target.value })
            }
          />
        </FormField>

        <FormToggle
          label="Always free"
          text="Enable free delivery"
          checked={form.isFree}
          onChange={() => onChange({ ...form, isFree: !form.isFree })}
        />
        <FormToggle
          label="Zone active"
          text="Mark zone active"
          checked={form.isActive}
          onChange={() => onChange({ ...form, isActive: !form.isActive })}
        />
      </fieldset>

      <DrawerFooter error={error}>
        <Button variant="secondary" type="button" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save configuration"}
        </Button>
      </DrawerFooter>
    </form>
  )
}
