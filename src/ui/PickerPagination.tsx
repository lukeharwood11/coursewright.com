import { Button } from "@/ui/Button";

/** Max selectable rows shown at once in searchable picker modals. */
export const PICKER_PAGE_SIZE = 10;

/** Fixed-height list region so modals do not resize when pages or filters change. */
export const pickerModalListShellClass =
  "flex min-h-[24rem] flex-col overflow-hidden rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)]";

export const pickerModalListScrollClass = "min-h-0 flex-1 overflow-y-auto p-2";

/** Reserved whether or not the current result set paginates. */
export const pickerModalPagerSlotClass =
  "flex min-h-[2.75rem] shrink-0 flex-col justify-center";

export function slicePickerPage<T>(
  items: T[],
  page: number,
  pageSize = PICKER_PAGE_SIZE,
): {
  page: number;
  pageCount: number;
  items: T[];
  needsPagination: boolean;
  total: number;
} {
  const total = items.length;
  const needsPagination = total > pageSize;
  if (!needsPagination) {
    return { page: 1, pageCount: 1, items, needsPagination: false, total };
  }
  const pageCount = Math.ceil(total / pageSize);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    items: items.slice(start, start + pageSize),
    needsPagination: true,
    total,
  };
}

export function PickerPaginationBar({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line-soft)] px-1 py-2">
      <Button
        type="button"
        variant="secondary"
        className="py-2 text-[12px]"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <p className="text-[12.5px] text-[var(--ink-soft)]">
        Page {page} of {pageCount}
        <span className="text-[var(--ink-faint)]"> · {total} total</span>
      </p>
      <Button
        type="button"
        variant="secondary"
        className="py-2 text-[12px]"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
