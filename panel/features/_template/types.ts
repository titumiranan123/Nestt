export type TemplateItem = {
  id: string;
  label: string;
};

export type TemplateListParams = {
  page: number;
  pageSize: number;
  search?: string;
};

export type TemplateListResult = {
  items: TemplateItem[];
  total: number;
};
