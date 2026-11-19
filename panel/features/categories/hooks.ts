"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryKeys } from "@/features/inventory/keys";
import { productKeys } from "@/features/products/keys";
import { categoriesApi } from "./api";
import type { CategoryInput } from "./types";

const categoriesKey = ["admin", "categories"] as const;

export const categoryQueries = {
  list: queryOptions({ queryKey: categoriesKey, queryFn: ({ signal }) => categoriesApi.list(signal) }),
  detail: (id: string) => queryOptions({ queryKey: [...categoriesKey, id], queryFn: ({ signal }) => categoriesApi.get(id, signal) }),
};

export function useCategoryActions() {
  const client = useQueryClient();
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: categoriesKey }),
    client.invalidateQueries({ queryKey: inventoryKeys.list }),
    client.invalidateQueries({ queryKey: productKeys.all }),
  ]);
  const save = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryInput }) => id ? categoriesApi.update(id, input) : categoriesApi.create(input),
    onSuccess: refresh,
    meta: { successMessage: "Category saved." },
  });
  const remove = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: refresh,
    meta: { successMessage: "Category deleted." },
  });
  const publish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => categoriesApi.update(id, { isPublished }),
    onSuccess: refresh,
    meta: { successMessage: "Category visibility updated." },
  });
  return { save, remove, publish };
}
