import { useMemo, useState } from "react";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { ListPagination } from "@/ui/ListPagination";
import { roleLabel } from "@/organizations/model/role";
import {
  clampOrgPeopleAccessPage,
  filterOrgPeopleAccess,
  orgPeopleAccessHasActiveFilters,
  orgPeopleAccessPageCount,
  orgPeopleAccessRangeLabel,
  ORG_PEOPLE_ACCESS_ROLE_FILTER_VALUES,
  paginateOrgPeopleAccess,
  type OrgPeopleAccessRoleFilter,
} from "@/organizations/model/orgPeopleAccessList";
import type { OrgPeopleMemberRow } from "../hooks/useOrgPeople";
import type { StaffMemberRow } from "../hooks/useOrgStaff";
import { OrgPeopleMemberRow as OrgPeopleMemberRowView } from "./OrgPeopleMemberRow";

export function PeopleAccessPanel({
  orgSlug,
  loading,
  members,
  staffByMembershipId,
  busyMembershipId,
  removingCollaboratorId,
  onSuspend,
  onReactivate,
  onRemoveFromOrg,
  onRemoveAsCollaborator,
}: {
  orgSlug: string;
  loading: boolean;
  members: OrgPeopleMemberRow[];
  staffByMembershipId: Map<number, StaffMemberRow>;
  busyMembershipId: number | null;
  removingCollaboratorId: number | null;
  onSuspend: (member: OrgPeopleMemberRow) => void;
  onReactivate: (member: OrgPeopleMemberRow) => void;
  onRemoveFromOrg: (member: OrgPeopleMemberRow) => void;
  onRemoveAsCollaborator: (staff: StaffMemberRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<OrgPeopleAccessRoleFilter>("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ query, role: roleFilter }),
    [query, roleFilter],
  );
  const hasActiveFilters = orgPeopleAccessHasActiveFilters(filters);

  const filtered = useMemo(
    () => filterOrgPeopleAccess(members, filters),
    [members, filters],
  );

  const pageCount = orgPeopleAccessPageCount(filtered.length);
  const safePage = clampOrgPeopleAccessPage(page, filtered.length);
  const pageMembers = useMemo(
    () => paginateOrgPeopleAccess(filtered, safePage),
    [filtered, safePage],
  );

  function resetPage() {
    setPage(1);
  }

  function onQueryChange(value: string) {
    setQuery(value);
    resetPage();
  }

  function onRoleFilterChange(value: string) {
    setRoleFilter(value as OrgPeopleAccessRoleFilter);
    resetPage();
  }

  return (
    <>
      <p className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
        Everyone with a linked account. Suspend blocks sign-in temporarily. Remove
        ends all access and unlinks their login from their org profile.
      </p>

      {!loading && members.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-md">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Find people
            </span>
            <Input
              className="w-full"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by name or email"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 sm:w-48">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Role
            </span>
            <Select
              wrapperClassName="w-full"
              value={roleFilter}
              onChange={(event) => onRoleFilterChange(event.target.value)}
            >
              <option value="">All roles</option>
              {ORG_PEOPLE_ACCESS_ROLE_FILTER_VALUES.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </Select>
          </label>
          <p
            className="shrink-0 text-[12.5px] font-bold text-[var(--ink-faint)] sm:ml-auto sm:py-[13px]"
            aria-live="polite"
          >
            {hasActiveFilters
              ? `${filtered.length} match${filtered.length === 1 ? "" : "es"}`
              : `${members.length} ${
                  members.length === 1 ? "person" : "people"
                }`}
          </p>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading access…</p>
      ) : null}

      {!loading && members.length === 0 ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
          No one has claimed an account in this organization yet.
        </p>
      ) : null}

      {!loading && members.length > 0 && filtered.length === 0 ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
          No one matches those filters.
        </p>
      ) : null}

      {!loading && pageMembers.length > 0 ? (
        <>
          <ul className="mt-3 divide-y divide-[var(--line-soft)]">
            {pageMembers.map((member) => (
              <OrgPeopleMemberRowView
                key={member.membershipId}
                orgSlug={orgSlug}
                member={member}
                staffMember={staffByMembershipId.get(member.membershipId)}
                busy={
                  busyMembershipId === member.membershipId ||
                  removingCollaboratorId === member.membershipId
                }
                onSuspend={onSuspend}
                onReactivate={onReactivate}
                onRemoveFromOrg={onRemoveFromOrg}
                onRemoveAsCollaborator={onRemoveAsCollaborator}
              />
            ))}
          </ul>
          <ListPagination
            rangeLabel={orgPeopleAccessRangeLabel(filtered.length, safePage)}
            page={safePage}
            pageCount={pageCount}
            canPrev={safePage > 1}
            canNext={safePage < pageCount}
            onPrev={() => setPage(safePage - 1)}
            onNext={() => setPage(safePage + 1)}
          />
        </>
      ) : null}
    </>
  );
}
