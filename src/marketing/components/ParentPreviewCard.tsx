import { CalendarDaysIcon, DocumentTextIcon, ExclamationTriangleIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Mark } from "@/ui/Wordmark";

/** Static illustration of the parent “this week” pattern — not live product data. */
export function ParentPreviewCard() {
  return (
    <div
      className="w-full rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
      style={{ boxShadow: "var(--shadow)" }}
      aria-hidden
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-bold text-[var(--ink)]">Your co-op</p>
        <Mark px={28} />
      </div>
      <h2
        className="text-[21px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        This week&apos;s materials
      </h2>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ink-faint)]">
          <CalendarDaysIcon className="h-4 w-4" />
          Week of Sep 1 – Sep 7
        </p>
        <span className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[12px] font-bold text-[var(--ink)]">
          <PrinterIcon className="h-4 w-4" />
          Print this week
        </span>
      </div>

      <div className="mt-4 rounded-[10px] border border-[var(--amber-tint)] bg-[var(--amber-tint)] py-3 pr-3 pl-3">
        <div className="border-l-4 border-[var(--amber)] pl-3">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[var(--amber-deep)]">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Important now
          </p>
          <p className="mt-1 text-[14px] text-[var(--ink)]">Bring your nature journal on Friday.</p>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-[var(--line-soft)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] px-3 py-2.5">
          <p className="text-[13.5px] font-extrabold text-[var(--ink)]">Science</p>
          <span className="rounded-full bg-[var(--line-soft)] px-2 py-0.5 text-[11.5px] font-bold text-[var(--ink-soft)]">
            Grade 4
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex min-w-0 items-start gap-2">
            <DocumentTextIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]" />
            <div>
              <p className="text-[13.5px] font-semibold text-[var(--ink)]">Friday nature walk</p>
              <p className="text-[12px] font-bold text-[var(--amber-deep)]">Fri, Sep 5</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--line)] px-2.5 py-1 text-[12px] font-bold text-[var(--ink)]">
            <PrinterIcon className="h-4 w-4" />
            Print
          </span>
        </div>
      </div>
    </div>
  );
}
