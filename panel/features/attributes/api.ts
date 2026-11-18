import { apiClient } from "@/lib/api/client";
import type { Attribute, AttributeInput, AttributeOption, AttributeOptionInput } from "./types";

export const attributesApi = {
  list: () => apiClient<Attribute[]>("/admin/attributes"),
  get: (id: string) => apiClient<Attribute>(`/admin/attributes/${id}`),
  create: (input: AttributeInput) => apiClient<Attribute>("/admin/attributes", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
  }),
  update: (id: string, input: Partial<AttributeInput>) => apiClient<Attribute>(`/admin/attributes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
  }),
  remove: (id: string) => apiClient<{ deleted: boolean }>(`/admin/attributes/${id}`, { method: "DELETE" }),
  createOption: (attributeId: string, input: AttributeOptionInput) => apiClient<AttributeOption>(`/admin/attributes/${attributeId}/options`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
  }),
  updateOption: (attributeId: string, optionId: string, input: Partial<AttributeOptionInput>) => apiClient<AttributeOption>(`/admin/attributes/${attributeId}/options/${optionId}`, {
    method: "PUT",
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
  }),
  removeOption: (attributeId: string, optionId: string) => apiClient<{ deleted: boolean }>(`/admin/attributes/${attributeId}/options/${optionId}`, { method: "DELETE" }),
};
