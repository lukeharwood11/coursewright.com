import type { OrgSettingsTabId } from "../orgSettingsTabConfig";
import { orgSettingsTabById } from "../orgSettingsTabConfig";

export function OrgSettingsSectionTitle({ tab }: { tab: OrgSettingsTabId }) {
  const { label, outline: Icon } = orgSettingsTabById(tab);

  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-[var(--ink-soft)]" aria-hidden />
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">{label}</h2>
    </div>
  );
}
