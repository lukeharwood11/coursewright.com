import {
  orgSettingsTabs,
  type OrgSettingsTabId,
} from "../orgSettingsTabConfig";
import { NewPill } from "@/ui/NewPill";
import { Select } from "@/ui/Select";

export type { OrgSettingsTabId } from "../orgSettingsTabConfig";
export { parseOrgSettingsTab } from "../orgSettingsTabConfig";

function isOrgSettingsTabId(
  value: string,
  tabs: ReturnType<typeof orgSettingsTabs>,
): value is OrgSettingsTabId {
  return tabs.some((tab) => tab.id === value);
}

export function OrgSettingsNav({
  active,
  showBilling,
  onSelect,
}: {
  active: OrgSettingsTabId;
  showBilling: boolean;
  onSelect: (tab: OrgSettingsTabId) => void;
}) {
  const tabs = orgSettingsTabs({ showBilling });

  return (
    <nav aria-label="Settings sections">
      <div className="md:hidden">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Section
          </span>
          <Select
            wrapperClassName="w-full"
            value={active}
            onChange={(event) => {
              const next = event.target.value;
              if (isOrgSettingsTabId(next, tabs)) onSelect(next);
            }}
            aria-label="Settings section"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
                {tab.featureNew ? " (New)" : ""}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <ul
        role="tablist"
        aria-orientation="vertical"
        className="hidden md:flex md:w-full md:flex-col"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          const Icon = selected ? tab.solid : tab.outline;
          return (
            <li key={tab.id} className="md:w-full">
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onSelect(tab.id)}
                className={[
                  "flex w-full items-center gap-2 border-r-2 px-3 py-2 text-left text-[13.5px] font-semibold transition-colors",
                  "focus:outline-none focus-visible:bg-[var(--green-tint)]",
                  selected
                    ? "border-[var(--green)] text-[var(--green-deep)]"
                    : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.featureNew ? <NewPill /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
