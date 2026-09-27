import type { OrgMemberAccessStatus } from "@/organizations/databridge/memberships";
import { roleLabel, type OrgRole } from "@/organizations/model/role";

export const ORG_PEOPLE_ACCESS_PAGE_SIZE = 20;

/** Empty string = no role filter. */
export type OrgPeopleAccessRoleFilter = OrgRole | "";

export const ORG_PEOPLE_ACCESS_ROLE_FILTER_VALUES: readonly OrgRole[] = [
  "owner",
  "admin",
  "instructor",
  "observer",
  "parent",
  "student",
];

export type OrgPeopleAccessFilters = {
  query: string;
  role: OrgPeopleAccessRoleFilter;
};

export type OrgPeopleAccessFilterable = {
  name: string;
  email: string;
  role: OrgRole;
  isParent: boolean;
  isStudent: boolean;
  status: OrgMemberAccessStatus;
};

export function orgPeopleAccessMatchesQuery(
  member: OrgPeopleAccessFilterable,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    member.name,
    member.email,
    roleLabel(member.role),
    member.role,
    member.isParent ? "parent" : "",
    member.isStudent ? "student" : "",
    member.status === "suspended" ? "suspended" : "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

export function orgPeopleAccessMatchesRoleFilter(
  member: OrgPeopleAccessFilterable,
  roleFilter: OrgPeopleAccessRoleFilter,
): boolean {
  if (!roleFilter) return true;
  if (roleFilter === "parent") {
    return member.role === "parent" || member.isParent;
  }
  if (roleFilter === "student") {
    return member.role === "student" || member.isStudent;
  }
  return member.role === roleFilter;
}

export function filterOrgPeopleAccess<T extends OrgPeopleAccessFilterable>(
  members: T[],
  filters: OrgPeopleAccessFilters,
): T[] {
  return members.filter(
    (member) =>
      orgPeopleAccessMatchesQuery(member, filters.query) &&
      orgPeopleAccessMatchesRoleFilter(member, filters.role),
  );
}

export function orgPeopleAccessHasActiveFilters(filters: OrgPeopleAccessFilters): boolean {
  return Boolean(filters.query.trim()) || Boolean(filters.role);
}

export function orgPeopleAccessPageCount(
  total: number,
  pageSize = ORG_PEOPLE_ACCESS_PAGE_SIZE,
): number {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
}

export function clampOrgPeopleAccessPage(
  page: number,
  total: number,
  pageSize = ORG_PEOPLE_ACCESS_PAGE_SIZE,
): number {
  const maxPage = orgPeopleAccessPageCount(total, pageSize);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(page, maxPage);
}

export function paginateOrgPeopleAccess<T>(
  members: T[],
  page: number,
  pageSize = ORG_PEOPLE_ACCESS_PAGE_SIZE,
): T[] {
  const safePage = clampOrgPeopleAccessPage(page, members.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return members.slice(start, start + pageSize);
}

export function orgPeopleAccessRangeLabel(
  total: number,
  page: number,
  pageSize = ORG_PEOPLE_ACCESS_PAGE_SIZE,
): string {
  if (total === 0) return "0 people";
  const safePage = clampOrgPeopleAccessPage(page, total, pageSize);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  const noun = total === 1 ? "person" : "people";
  if (start === end && total === 1) return `1 ${noun}`;
  return `${start}–${end} of ${total}`;
}
