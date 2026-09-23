import type { CSSProperties, ReactNode } from "react";
import { ActivityPushChrome, ActivityPushProvider } from "@/notifications";
import { primaryColorVars } from "@/organizations/model/brand";
import { useAppShell } from "../OrgShellContext";
import { OrgShellHeader } from "./OrgShellHeader";
import { OrgSidebar } from "./OrgSidebar";

export const APP_SHELL_MAIN_ID = "app-shell-main";

export function AppShellFrame({ children }: { children: ReactNode }) {
  const { organization } = useAppShell();
  const brandStyle = primaryColorVars(organization?.accentColor) as CSSProperties | undefined;
  return (
    <ActivityPushProvider>
      <div className="flex h-dvh overflow-hidden bg-[var(--paper)]" style={brandStyle}>
        <OrgSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <OrgShellHeader />
          <ActivityPushChrome showPrompt={organization != null} />
          <main id={APP_SHELL_MAIN_ID} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ActivityPushProvider>
  );
}
