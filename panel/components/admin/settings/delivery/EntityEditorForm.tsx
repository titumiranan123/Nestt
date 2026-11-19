"use client"

import type { FormEvent } from "react"
import { Button, DrawerFooter, FormField, FormToggle, Select } from "./DeliveryForm"
import type {
  DeliveryZone,
  District,
  Division,
  EntityFormState,
  EntityEditor,
} from "@/features/delivery/types"

type EntityEditorFormProps = {
  editor: EntityEditor
  form: EntityFormState
  divisions: Division[]
  districts: District[]
  isSaving: boolean
  error: string
  onChange: (form: EntityFormState) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function EntityEditorForm({
  editor,
  form,
  divisions,
  districts,
  isSaving,
  error,
  onChange,
  onClose,
  onSubmit,
}: EntityEditorFormProps) {
  return (
    <form
      className="delivery-drawer flex min-h-full flex-col"
      aria-busy={isSaving}
      onSubmit={onSubmit}
    >
      <fieldset disabled={isSaving} className="min-w-0 flex-1 space-y-4 p-5 sm:px-6">
        <FormField label="Name">
          <input
            className="delivery-input"
            maxLength={100}
            required
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
          />
        </FormField>

        {editor.type === "district" ? (
          <FormField label="Division">
            <Select
              required
              value={form.divisionId}
              onChange={(event) => onChange({ ...form, divisionId: event.target.value })}
            >
              <option value="">Select division</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}

        {editor.type === "thana" ? (
          <>
            <FormField label="District">
              <Select
                required
                value={form.districtId}
                onChange={(event) =>
                  onChange({ ...form, districtId: event.target.value })
                }
              >
                <option value="">Select district</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Delivery zone">
              <Select
                value={form.deliveryZone}
                onChange={(event) =>
                  onChange({
                    ...form,
                    deliveryZone: event.target.value as DeliveryZone,
                  })
                }
              >
                <option value="INSIDE_DHAKA">Inside Dhaka</option>
                <option value="OUTSIDE_DHAKA">Outside Dhaka</option>
              </Select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Custom shipping fee">
                <input
                  className="delivery-input"
                  min={0}
                  step="0.01"
                  placeholder="Zone default"
                  type="number"
                  value={form.shippingFee}
                  onChange={(event) =>
                    onChange({ ...form, shippingFee: event.target.value })
                  }
                />
              </FormField>
              <FormField label="Free delivery above (optional)">
                <input
                  className="delivery-input"
                  min={0}
                  step="0.01"
                  placeholder="Leave blank to disable"
                  type="number"
                  value={form.freeDeliveryAbove}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      freeDeliveryAbove: event.target.value,
                    })
                  }
                />
              </FormField>
            </div>

            <FormToggle
              label="Deliverable"
              text="Enable delivery"
              checked={form.isDeliverable}
              onChange={() => onChange({ ...form, isDeliverable: !form.isDeliverable })}
            />
          </>
        ) : null}
      </fieldset>

      <DrawerFooter error={error}>
        <Button variant="secondary" type="button" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </DrawerFooter>
    </form>
  )
}
