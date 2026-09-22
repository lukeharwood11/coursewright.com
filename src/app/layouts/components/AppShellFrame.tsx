import type { ReactNode } from "react";
import { ActivityPushChrome, ActivityPushProvider } from "@/notifications";
import { useAppShell } from "../OrgShellContext";
import { OrgShellHeader } from "./OrgShellHeader";
import { OrgSidebar } from "./OrgSidebar";

export function AppShellFrame({ children }: { children: ReactNode }) {
  const { organization } = useAppShell();
  return (
    <ActivityPushProvider>
      <div className="flex min-h-screen bg-[var(--paper)]">
        <OrgSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <OrgShellHeader />
          <ActivityPushChrome showPrompt={organization != null} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ActivityPushProvider>
  );
}
