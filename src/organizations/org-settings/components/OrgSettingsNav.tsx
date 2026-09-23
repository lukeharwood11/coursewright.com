import type { ComponentType, SVGProps } from "react";
import {
  AdjustmentsHorizontalIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  IdentificationIcon,
  PaintBrushIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalSolidIcon,
  BuildingOffice2Icon as BuildingOffice2SolidIcon,
  CreditCardIcon as CreditCardSolidIcon,
  IdentificationIcon as IdentificationSolidIcon,
  PaintBrushIcon as PaintBrushSolidIcon,
  UsersIcon as UsersSolidIcon,
} from "@heroicons/react/24/solid";
import { Select } from "@/ui/Select";

export type OrgSettingsTabId =
  | "organization"
  | "profile"
  | "branding"
  | "customizations"
  | "collaborators"
  | "billing";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type OrgSettingsTab = {
  id: OrgSettingsTabId;
  label: string;
  outline: IconComponent;
  solid: IconComponent;
};

const ALL_TABS: OrgSettingsTab[] = [
  {
    id: "organization",
    label: "Organization",
    outline: BuildingOffice2Icon,
    solid: BuildingOffice2SolidIcon,
  },
  {
    id: "profile",
    label: "Profile",
    outline: IdentificationIcon,
    solid: IdentificationSolidIcon,
  },
  {
    id: "branding",
    label: "Branding",
    outline: PaintBrushIcon,
    solid: PaintBrushSolidIcon,
  },
  {
    id: "customizations",
    label: "Customizations",
    outline: AdjustmentsHorizontalIcon,
    solid: AdjustmentsHorizontalSolidIcon,
  },
  {
    id: "collaborators",
    label: "Collaborators",
    outline: UsersIcon,
    solid: UsersSolidIcon,
  },
  {
    id: "billing",
    label: "Billing",
    outline: CreditCardIcon,
    solid: CreditCardSolidIcon,
  },
];

export function orgSettingsTabs(options: {
  showBilling: boolean;
}): OrgSettingsTab[] {
  return ALL_TABS.filter((tab) => tab.id !== "billing" || options.showBilling);
}

export function parseOrgSettingsTab(
  value: string | null,
  options: { showBilling: boolean },
): OrgSettingsTabId {
  const tabs = orgSettingsTabs(options);
  const match = tabs.find((tab) => tab.id === value);
  return match?.id ?? "organization";
}

function isOrgSettingsTabId(
  value: string,
  tabs: OrgSettingsTab[],
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
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
