import type { ReactNode } from "react";
import { OrgShellHeader } from "./OrgShellHeader";
import { OrgSidebar } from "./OrgSidebar";

export function AppShellFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--paper)]">
      <OrgSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <OrgShellHeader />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
