export type PeopleSectionSubview = "collaborators" | "access";

export const PEOPLE_SECTION_VIEW_PARAM = "peopleView";

export function parsePeopleSectionSubview(
  value: string | null,
  options: {
    canManagePeople: boolean;
    canSeeCollaborators: boolean;
  },
): PeopleSectionSubview {
  if (value === "access" && options.canManagePeople) return "access";
  if (options.canSeeCollaborators) return "collaborators";
  if (options.canManagePeople) return "access";
  return "collaborators";
}

export function peopleSectionSubviewSearchValue(
  subview: PeopleSectionSubview,
): string | null {
  return subview === "access" ? "access" : null;
}
