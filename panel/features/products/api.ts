import { apiClient } from "@/lib/api/client";
import type { Product, ProductCategory, ProductInput, ProductVariant, ProductVariantInput } from "./types";

export const productsApi = {
  list: () => apiClient<Product[]>("/admin/products"),
  get: (id: string) => apiClient<Product>(`/admin/products/${id}`),
  create: (input: ProductInput) => apiClient<Product>("/admin/products", { method: "POST", body: JSON.stringify(input), headers: { "content-type": "application/json" } }),
  update: (id: string, input: Partial<ProductInput>) => apiClient<Product>(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(input), headers: { "content-type": "application/json" } }),
  remove: (id: string) => apiClient<{ id: string; deleted: boolean }>(`/admin/products/${id}`, { method: "DELETE" }),
  categories: () => apiClient<ProductCategory[]>("/admin/categories"),
  createVariant: (productId: string, input: ProductVariantInput) => apiClient<ProductVariant>(`/admin/products/${productId}/variants`, { method: "POST", body: JSON.stringify(input), headers: { "content-type": "application/json" } }),
  updateVariant: (productId: string, variantId: string, input: Partial<ProductVariantInput>) => apiClient<ProductVariant>(`/admin/products/${productId}/variants/${variantId}`, { method: "PUT", body: JSON.stringify(input), headers: { "content-type": "application/json" } }),
  removeVariant: (productId: string, variantId: string) => apiClient<{ id: string; deleted: boolean }>(`/admin/products/${productId}/variants/${variantId}`, { method: "DELETE" }),
};
