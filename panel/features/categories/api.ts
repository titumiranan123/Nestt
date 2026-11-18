import { apiClient } from "@/lib/api/client";
import type { Category, CategoryInput } from "./types";

export const categoriesApi = {
  list: () => apiClient<Category[]>("/admin/categories"),
  get: (id: string) => apiClient<Category>(`/admin/categories/${id}`),
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
