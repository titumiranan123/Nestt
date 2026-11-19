import { apiClient } from "@/lib/api/client";
import type { Category, CategoryInput } from "./types";

export const categoriesApi = {
  list: (signal?: AbortSignal) => apiClient<Category[]>("/admin/categories", { signal }),
  get: (id: string, signal?: AbortSignal) => apiClient<Category>(`/admin/categories/${id}`, { signal }),
  create: (input: CategoryInput) => apiClient<Category>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
  }),
  update: (id: string, input: Partial<CategoryInput>) => apiClient<Category>(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
  }),
  remove: (id: string) => apiClient<{ deleted: boolean }>(`/admin/categories/${id}`, { method: "DELETE" }),
};
