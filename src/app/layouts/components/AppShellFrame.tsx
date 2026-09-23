import type { CSSProperties, ReactNode } from "react";
import { ActivityPushChrome, ActivityPushProvider } from "@/notifications";
import { primaryColorVars } from "@/organizations/model/brand";
import { useAppShell } from "../OrgShellContext";
import { OrgShellHeader } from "./OrgShellHeader";
import { OrgSidebar } from "./OrgSidebar";

export function AppShellFrame({ children }: { children: ReactNode }) {
  const { organization } = useAppShell();
  const brandStyle = primaryColorVars(organization?.accentColor) as CSSProperties | undefined;
  return (
    <ActivityPushProvider>
      <div className="flex min-h-screen bg-[var(--paper)]" style={brandStyle}>
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
