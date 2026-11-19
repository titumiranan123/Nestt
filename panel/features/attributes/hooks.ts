"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { attributesApi } from "./api";
import type { Attribute, AttributeInput, AttributeOptionInput } from "./types";

const attributesKey = ["admin", "attributes"] as const;

export const attributeQueries = {
  list: queryOptions({ queryKey: attributesKey, queryFn: ({ signal }) => attributesApi.list(signal) }),
  detail: (id: string) => queryOptions({ queryKey: [...attributesKey, id], queryFn: ({ signal }) => attributesApi.get(id, signal) }),
};

type SaveAttribute = {
  existing: Attribute | null;
  input: AttributeInput;
  options: Array<{ id?: string; input: AttributeOptionInput }>;
};

async function saveAttribute({ existing, input, options }: SaveAttribute) {
  const saved = existing ? await attributesApi.update(existing.id, input) : await attributesApi.create(input);
  const retained = new Set(options.map(({ id }) => id));

  for (const option of options) {
    if (!option.input.name) continue;
    if (option.id) await attributesApi.updateOption(saved.id, option.id, option.input);
    else await attributesApi.createOption(saved.id, option.input);
  }
  for (const option of existing?.options ?? []) {
    if (!retained.has(option.id)) await attributesApi.removeOption(saved.id, option.id);
  }
  return saved;
}

export function useAttributeActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: attributesKey });
  const save = useMutation({
    mutationFn: saveAttribute,
    onSettled: refresh,
    meta: { successMessage: "Attribute saved." },
  });
  const remove = useMutation({
    mutationFn: attributesApi.remove,
    onSuccess: refresh,
    meta: { successMessage: "Attribute deleted." },
  });
  const publish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => attributesApi.update(id, { isPublished }),
    onSuccess: refresh,
    meta: { successMessage: "Attribute visibility updated." },
  });
  return { save, remove, publish };
}
