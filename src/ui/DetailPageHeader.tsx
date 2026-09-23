import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

/**
 * Shared chrome for detail screens: surface bar, compact title with inline
 * back control, optional meta row, optional description, and trailing actions.
 */
export function DetailPageHeader({
  backTo,
  backLabel,
  backState,
  title,
  titleAccessory,
  titleTrailing,
  meta,
  description,
  actions,
  actionsClassName,
}: {
  backTo: string;
  /** Accessible name for the back control (also used as the tooltip). */
  backLabel: string;
  /** Optional router location state for the back link. */
  backState?: unknown;
  title: ReactNode;
  /** Icon or control beside the title (e.g. details). */
  titleAccessory?: ReactNode;
  /** Controls after the title on the same row (e.g. overflow menu on narrow layouts). */
  titleTrailing?: ReactNode;
  /** Badges / chips under the title. */
  meta?: ReactNode;
  /** Extra copy under the meta row (description, location, …). */
  description?: ReactNode;
  /** Trailing actions (buttons, overflow menus). */
  actions?: ReactNode;
  actionsClassName?: string;
}) {
  return (
    <header className="shrink-0 border-b border-[var(--line-soft)] bg-[var(--surface)] px-3 py-3 md:px-6 lg:px-8">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              to={backTo}
              state={backState}
              className="inline-flex shrink-0 items-center justify-center rounded-[6px] p-1 text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              aria-label={backLabel}
              title={backLabel}
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden />
            </Link>
            <h1
              className="flex min-w-0 flex-1 items-center gap-1.5 text-[18px] font-semibold text-[var(--ink)] md:text-[20px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="min-w-0 truncate">{title}</span>
              {titleAccessory ? (
                <span className="inline-flex shrink-0">{titleAccessory}</span>
              ) : null}
            </h1>
            {titleTrailing ? (
              <span className="inline-flex shrink-0 items-center">
                {titleTrailing}
              </span>
            ) : null}
          </div>
          {meta ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-7">
              {meta}
            </div>
          ) : null}
          {description ? (
            <div className="mt-2 max-w-2xl space-y-2 pl-7">{description}</div>
          ) : null}
        </div>
        {actions ? (
          <div
            className={[
              "flex min-w-0 flex-wrap items-center gap-2 pl-7 xl:max-w-none xl:shrink-0 xl:justify-end xl:pl-0",
              actionsClassName ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
