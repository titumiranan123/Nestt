export type PaginationOptions = {
  pageSizeKey: 'limit' | 'pageSize';
  includePages?: boolean;
};

export function paginationOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function paginationResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  options: PaginationOptions,
) {
  return {
    items,
    total,
    page,
    [options.pageSizeKey]: pageSize,
    ...(options.includePages ? { pages: Math.ceil(total / pageSize) } : {}),
  };
}
