import type { TemplateItem, TemplateListParams, TemplateListResult } from "./types";

// Intentionally endpoint-free: replace these illustrative values with apiClient calls in a real module.
export const templateApi = {
  async list(_params: TemplateListParams): Promise<TemplateListResult> {
    return { items: [], total: 0 };
  },
  async save(item: TemplateItem): Promise<TemplateItem> {
    return item;
  },
};
