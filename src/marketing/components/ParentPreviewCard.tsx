import { CalendarDaysIcon, DocumentTextIcon, ExclamationTriangleIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Mark } from "@/ui/Wordmark";

/** Static illustration of the parent “this week” pattern — not live product data. */
export function ParentPreviewCard() {
  return (
    <div
      className="w-full rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3"
      style={{ boxShadow: "var(--shadow)" }}
      aria-hidden
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-bold text-[var(--ink)]">Your co-op</p>
        <Mark px={28} />
      </div>
      <h2
        className="text-[21px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Hi, Maya
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

      <div className="mt-3">
        <p className="text-[12px] font-bold text-[var(--ink-faint)]">Coming up</p>
        <div className="mt-1.5 border-y border-[var(--line-soft)] py-2">
          <p className="text-[12px] font-bold text-[var(--ink-faint)]">Assigned next</p>
          <p className="mt-0.5 text-[13.5px] font-semibold text-[var(--ink)]">
            Friday nature walk
          </p>
          <p className="text-[12px] font-bold text-[var(--slate)]">Assigned Fri, Sep 5</p>
        </div>
        <div className="border-b border-[var(--line-soft)] py-2">
          <p className="text-[12px] font-bold text-[var(--ink-faint)]">Due next</p>
          <p className="mt-0.5 text-[13.5px] font-semibold text-[var(--ink)]">
            Nature journal pages
          </p>
          <p className="text-[12px] font-bold text-[var(--amber-deep)]">Due Sun, Sep 7</p>
        </div>
      </div>

      <div className="mt-3 border-l-4 border-[var(--amber)] bg-[var(--amber-tint)] py-2 pr-2.5 pl-2.5">
        <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[var(--amber-deep)]">
          <ExclamationTriangleIcon className="h-4 w-4" />
          Important now
        </p>
        <p className="mt-1 text-[14px] text-[var(--ink)]">Bring your nature journal on Friday.</p>
      </div>

      <div className="mt-3">
        <p className="text-[12px] font-bold text-[var(--ink-faint)]">This week</p>
        <p className="mt-1.5 text-[13.5px] font-extrabold text-[var(--ink)]">Science</p>
        <div className="mt-1.5 flex items-start justify-between gap-2.5 border-y border-[var(--line-soft)] py-2">
          <div className="flex min-w-0 items-start gap-2">
            <DocumentTextIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]" />
            <div>
              <p className="text-[13.5px] font-semibold text-[var(--ink)]">Friday nature walk</p>
              <p className="mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[12px] font-bold">
                <span className="text-[var(--slate)]">Assigned Fri, Sep 5</span>
                <span className="text-[var(--amber-deep)]">Due Sun, Sep 7</span>
              </p>
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
