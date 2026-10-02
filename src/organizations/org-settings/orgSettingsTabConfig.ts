import type { ComponentType, SVGProps } from "react";
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  IdentificationIcon,
  PaintBrushIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  AcademicCapIcon as AcademicCapSolidIcon,
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalSolidIcon,
  BuildingOffice2Icon as BuildingOffice2SolidIcon,
  ClipboardDocumentListIcon as ClipboardDocumentListSolidIcon,
  CreditCardIcon as CreditCardSolidIcon,
  IdentificationIcon as IdentificationSolidIcon,
  PaintBrushIcon as PaintBrushSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
} from "@heroicons/react/24/solid";

export type OrgSettingsTabId =
  | "organization"
  | "profile"
  | "grading"
  | "outcomes"
  | "branding"
  | "customizations"
  | "people"
  | "billing";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type OrgSettingsTabConfig = {
  id: OrgSettingsTabId;
  label: string;
  outline: IconComponent;
  solid: IconComponent;
  featureNew?: boolean;
};

const ALL_TABS: OrgSettingsTabConfig[] = [
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
    id: "grading",
    label: "Grading",
    outline: AcademicCapIcon,
    solid: AcademicCapSolidIcon,
  },
  {
    id: "outcomes",
    label: "Outcomes",
    outline: ClipboardDocumentListIcon,
    solid: ClipboardDocumentListSolidIcon,
    featureNew: true,
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
    id: "people",
    label: "People",
    outline: UserGroupIcon,
    solid: UserGroupSolidIcon,
    featureNew: true,
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
}): OrgSettingsTabConfig[] {
  return ALL_TABS.filter((tab) => tab.id !== "billing" || options.showBilling);
}

export function orgSettingsTabById(id: OrgSettingsTabId): OrgSettingsTabConfig {
  const tab = ALL_TABS.find((entry) => entry.id === id);
  if (!tab) throw new Error(`Unknown org settings tab: ${id}`);
  return tab;
}

export function parseOrgSettingsTab(
  value: string | null,
  options: { showBilling: boolean },
): OrgSettingsTabId {
  const tabs = orgSettingsTabs(options);
  const normalized = value === "collaborators" ? "people" : value;
  const match = tabs.find((tab) => tab.id === normalized);
  return match?.id ?? "organization";
}
