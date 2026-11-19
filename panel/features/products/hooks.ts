"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard/keys";
import { inventoryKeys } from "@/features/inventory/keys";
import { productsApi } from "./api";
import { productKeys } from "./keys";
import type { ProductInput, ProductVariantInput } from "./types";

export const productQueries = {
  list: queryOptions({ queryKey: productKeys.all, queryFn: ({ signal }) => productsApi.list(signal) }),
  detail: (id: string) => queryOptions({ queryKey: productKeys.detail(id), queryFn: ({ signal }) => productsApi.get(id, signal) }),
  brands: queryOptions({ queryKey: productKeys.brands, queryFn: ({ signal }) => productsApi.brands(signal) }),
};

type SaveProduct = {
  id?: string;
  input: ProductInput;
  variants: Array<{ id?: string; input: ProductVariantInput }>;
  removedVariantIds: string[];
};

async function saveProduct({ id, input, variants, removedVariantIds }: SaveProduct) {
  if (!id) {
    return productsApi.create({ ...input, variants: variants.length ? variants.map((variant) => variant.input) : undefined });
  }

  const product = await productsApi.update(id, input);
  const results = await Promise.allSettled([
    ...removedVariantIds.map((variantId) => productsApi.removeVariant(id, variantId)),
    ...variants.map((variant) => variant.id
      ? productsApi.updateVariant(id, variant.id, variant.input)
      : productsApi.createVariant(id, variant.input)),
  ]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  return product;
}

export function useProductActions() {
  const client = useQueryClient();
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: productKeys.all }),
    client.invalidateQueries({ queryKey: inventoryKeys.all }),
    client.invalidateQueries({ queryKey: dashboardKeys.overview }),
    client.invalidateQueries({ queryKey: dashboardKeys.inventoryAlerts }),
  ]);
  const save = useMutation({ mutationFn: saveProduct, onSettled: refresh, meta: { successMessage: "Product saved." } });
  const remove = useMutation({ mutationFn: productsApi.remove, onSuccess: refresh, meta: { successMessage: "Product deleted." } });
  return { save, remove };
}
