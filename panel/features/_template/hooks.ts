import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { templateApi } from "./api";
import { templateKeys } from "./keys";
import type { TemplateItem, TemplateListParams } from "./types";

export function useTemplateList(params: TemplateListParams) {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => templateApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSaveTemplateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: TemplateItem) => templateApi.save(item),
    meta: { successMessage: "Template item saved." },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: templateKeys.lists() }),
  });
}
