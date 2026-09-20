import { Button } from "@/ui/Button";

export function CourseListPagination({
  rangeLabel,
  page,
  pageCount,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  rangeLabel: string;
  page: number;
  pageCount: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (pageCount <= 1) {
    return (
      <p className="mt-4 text-[13px] text-[var(--ink-faint)]">{rangeLabel}</p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-[var(--ink-faint)]">
        {rangeLabel}
        <span className="text-[var(--ink-soft)]"> · Page {page} of {pageCount}</span>
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={!canPrev} onClick={onPrev}>
          Previous
        </Button>
        <Button type="button" variant="secondary" disabled={!canNext} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
