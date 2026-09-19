import { useId, useState } from "react";
import { Outlet } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { DocsSidebar } from "./components/DocsSidebar";

export function DocsLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-5 py-8 sm:py-10 lg:gap-10">
      <aside className="hidden w-52 shrink-0 lg:block xl:w-56">
        <p className="mb-3 text-[13px] font-bold text-[var(--ink-faint)]">Help</p>
        <DocsSidebar />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-5 lg:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13.5px] font-bold text-[var(--ink)]"
            aria-expanded={mobileOpen}
            aria-controls={panelId}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <XMarkIcon className="h-5 w-5" aria-hidden />
            ) : (
              <Bars3Icon className="h-5 w-5" aria-hidden />
            )}
            Help topics
          </button>
          {mobileOpen ? (
            <div
              id={panelId}
              className="mt-3 rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--surface)] p-3"
            >
              <DocsSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          ) : null}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
