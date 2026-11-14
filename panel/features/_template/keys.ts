import type { TemplateListParams } from "./types";

export const templateKeys = {
  all: ["template"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (params: TemplateListParams) => [...templateKeys.lists(), params] as const,
  detail: (id: string) => [...templateKeys.all, "detail", id] as const,
};
