type TablePaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  itemLabel: string;
  onPage: (page: number) => void;
  hideWhenSinglePage?: boolean;
};

export function TablePagination({
  total,
  page,
  pageSize,
  pageCount,
  itemLabel,
  onPage,
  hideWhenSinglePage = false,
}: TablePaginationProps) {
  if (hideWhenSinglePage && pageCount <= 1) return null;

  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const lastPage = Math.min(pageCount, firstPage + 4);

  return (
    <footer className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing <strong className="font-semibold text-gray-800">{firstItem}–{lastItem}</strong> of{" "}
        <strong className="font-semibold text-gray-800">{total.toLocaleString()}</strong> {itemLabel}
      </span>
      <nav aria-label={`${itemLabel} pages`} className="flex items-center gap-1 self-end sm:self-auto">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-md border border-gray-200 px-3 py-2 text-xs transition hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: Math.max(0, lastPage - firstPage + 1) }, (_, index) => {
          const pageNumber = firstPage + index;
          const current = page === pageNumber;

          return (
            <button
              key={pageNumber}
              type="button"
              aria-current={current ? "page" : undefined}
              aria-label={`Page ${pageNumber}`}
              onClick={() => onPage(pageNumber)}
              className={`min-w-8 rounded-md border px-2 py-2 text-xs transition ${
                current
                  ? "border-brand bg-brand font-semibold text-white"
                  : "border-transparent text-gray-600 hover:border-gray-200 hover:text-brand"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className="rounded-md border border-gray-200 px-3 py-2 text-xs transition hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </nav>
    </footer>
  );
}
