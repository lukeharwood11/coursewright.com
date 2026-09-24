import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/Select";
import { Tab, TabList } from "@/ui/Tabs";
import { listOrgPeople } from "@/organizations/databridge/memberships";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import type { OrgRole } from "@/organizations/model/role";
import {
  deleteResourceGrant,
  listFolderGrants,
  listItemGrants,
  resourceGrantQueryKeys,
  upsertResourceGrant,
} from "@/resources/databridge/grants";
import {
  loadFolderAncestors,
  resourceFolderQueryKeys,
  updateResourceFolder,
} from "@/resources/databridge/folders";
import { updateResourceItem } from "@/resources/databridge/items";
import {
  previewResourceAudience,
  resourceAccessCards,
  type FolderAclSource,
  type NamedResourceGrant,
  type ResourceAudience,
  type ResourceGrantRecord,
} from "@/resources/model/access";
import type { ResourceGrantPermission } from "@/resources/model/kinds";
import { caughtErrorMessage } from "@/ui/toast";

type AudienceTab = "parents" | "students";

type Target =
  | { kind: "folder"; id: number; organizationId: number; canInherit: boolean }
  | { kind: "item"; id: number; organizationId: number; canInherit: boolean };

export function AccessSettingsDialog({
  open,
  target,
  audience,
  aclInherit,
  parentId,
  folderId,
  unpublished: _unpublished,
  onClose,
  onSaved,
}: {
  open: boolean;
  target: Target | null;
  audience: ResourceAudience;
  aclInherit: boolean;
  parentId: number | null;
  folderId: number | null;
  unpublished: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [inherit, setInherit] = useState(aclInherit);
  const [parentsCanView, setParentsCanView] = useState(audience.parentsCanView);
  const [studentsCanView, setStudentsCanView] = useState(audience.studentsCanView);
  const [tab, setTab] = useState<AudienceTab>("parents");
  const [personId, setPersonId] = useState("");
  const [permission, setPermission] = useState<"read" | "write">("read");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInherit(aclInherit);
    setParentsCanView(audience.parentsCanView);
    setStudentsCanView(audience.studentsCanView);
    setTab("parents");
    setPersonId("");
    setError(null);
  }, [aclInherit, audience.parentsCanView, audience.studentsCanView, open, target?.id]);

  const chainId = target?.kind === "folder" ? parentId : folderId;
  const chainQuery = useQuery({
    queryKey: resourceFolderQueryKeys.ancestors(chainId ?? 0),
    queryFn: () => loadFolderAncestors(chainId!),
    enabled: open && chainId != null,
  });
  const peopleQuery = useQuery({
    queryKey: orgQueryKeys.people(target?.organizationId ?? 0),
    queryFn: () => listOrgPeople(target!.organizationId),
    enabled: open && Boolean(target),
  });
  const grantsQuery = useQuery({
    queryKey:
      target?.kind === "folder"
        ? resourceGrantQueryKeys.folder(target.id)
        : resourceGrantQueryKeys.item(target?.id ?? 0),
    queryFn: () =>
      target?.kind === "folder"
        ? listFolderGrants(target.id)
        : listItemGrants(target!.id),
    enabled: open && Boolean(target),
  });

  const foldersById = useMemo(() => {
    const map = new Map<number, FolderAclSource>();
    for (const folder of chainQuery.data ?? []) map.set(folder.id, folder);
    return map;
  }, [chainQuery.data]);

  const draft = { parentsCanView, studentsCanView };
  const preview =
    target == null
      ? { audience: draft, sourceFolderId: null, unresolved: false }
      : previewResourceAudience({
          kind: target.kind,
          id: target.id,
          parentId,
          folderId,
          inherit: target.canInherit ? inherit : false,
          draft,
          foldersById,
        });

  const followsSource =
    target != null &&
    (target.canInherit ? inherit : false) &&
    preview.sourceFolderId != null &&
    (target.kind === "item" || preview.sourceFolderId !== target.id);
  const sourceGrantsQuery = useQuery({
    queryKey: resourceGrantQueryKeys.folder(preview.sourceFolderId ?? 0),
    queryFn: () => listFolderGrants(preview.sourceFolderId!),
    enabled: open && followsSource,
  });

  const people = peopleQuery.data ?? [];
  const ownGrants = grantsQuery.data ?? [];
  const custom = !target || !target.canInherit || !inherit;
  const shownGrants = custom
    ? ownGrants
    : followsSource
      ? (sourceGrantsQuery.data ?? [])
      : [];
  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.userId, person])),
    [people],
  );

  const saveAcl = useMutation({
    mutationFn: async () => {
      if (!target) return;
      const patch = {
        parentsCanView,
        studentsCanView,
        aclInherit: target.canInherit ? inherit : false,
      };
      if (target.kind === "folder") {
        await updateResourceFolder(target.id, patch);
      } else {
        await updateResourceItem(target.id, patch);
      }
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const grantKey =
    target?.kind === "folder"
      ? resourceGrantQueryKeys.folder(target.id)
      : resourceGrantQueryKeys.item(target?.id ?? 0);

  const addGrant = useMutation({
    mutationFn: async () => {
      if (!target || !personId) throw new Error("Pick a person.");
      return upsertResourceGrant({
        organizationId: target.organizationId,
        folderId: target.kind === "folder" ? target.id : null,
        itemId: target.kind === "item" ? target.id : null,
        granteeUserId: personId,
        permission,
      });
    },
    onSuccess: () => {
      setPersonId("");
      void queryClient.invalidateQueries({ queryKey: grantKey });
    },
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const removeGrant = useMutation({
    mutationFn: (id: number) => deleteResourceGrant(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: grantKey });
    },
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const changeGrant = useMutation({
    mutationFn: (input: { granteeUserId: string; permission: "read" | "write" }) => {
      if (!target) throw new Error("Choose what to update.");
      return upsertResourceGrant({
        organizationId: target.organizationId,
        folderId: target.kind === "folder" ? target.id : null,
        itemId: target.kind === "item" ? target.id : null,
        granteeUserId: input.granteeUserId,
        permission: input.permission,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: grantKey });
    },
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  if (!open || !target) return null;

  const shownAudience = custom ? draft : preview.audience;
  const tabRole: OrgRole = tab === "parents" ? "parent" : "student";
  const namedGrants = peopleQuery.isSuccess
    ? shownGrants.map((grant) => namedGrant(grant, peopleById.get(grant.granteeUserId)))
    : [];
  const tabGrants = namedGrants.filter((grant) => grant.audience === tabRoleToAudience(tabRole));
  const otherGrants = namedGrants.filter((grant) => grant.audience === "other");
  const grantable = people.filter(
    (person) =>
      person.role === tabRole &&
      !ownGrants.some((grant) => grant.granteeUserId === person.userId),
  );
  const accessCards = resourceAccessCards({
    kind: target.kind,
    audience: shownAudience,
    grants: peopleQuery.isSuccess || namedGrants.length === 0 ? namedGrants : [],
  });

  function turnOffInherit() {
    setParentsCanView(preview.audience.parentsCanView);
    setStudentsCanView(preview.audience.studentsCanView);
    setInherit(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-access-title"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow)]"
      >
        <div className="overflow-y-auto px-5 pb-5 pt-5">
          <h2
            id="resource-access-title"
            className="text-[15.5px] font-extrabold text-[var(--ink)]"
          >
            Manage access
          </h2>
          <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
            {target.kind === "folder"
              ? "Parents and students are separate. Published items inside follow this folder unless an item sets its own access."
              : "Parents and students are separate. Editors can always see drafts."}
          </p>

          {target.canInherit ? (
            <label className="mt-4 flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
                checked={inherit}
                onChange={(event) => {
                  if (event.target.checked) setInherit(true);
                  else turnOffInherit();
                }}
              />
              <span>
                <span className="block text-[14px] font-semibold text-[var(--ink)]">
                  Inherit folder access
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--ink-faint)]">
                  Use the folder this is in. Turn this off to choose parents and
                  students separately.
                </span>
              </span>
            </label>
          ) : null}

          <TabList label="Audience" className="mt-4">
            <Tab
              selected={tab === "parents"}
              onSelect={() => {
                setTab("parents");
                setPersonId("");
              }}
            >
              Parents
            </Tab>
            <Tab
              selected={tab === "students"}
              onSelect={() => {
                setTab("students");
                setPersonId("");
              }}
            >
              Students
            </Tab>
          </TabList>

          <div role="tabpanel" className="pt-4">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
                checked={
                  tab === "parents"
                    ? shownAudience.parentsCanView
                    : shownAudience.studentsCanView
                }
                disabled={!custom}
                onChange={(event) => {
                  if (tab === "parents") setParentsCanView(event.target.checked);
                  else setStudentsCanView(event.target.checked);
                }}
              />
              <span>
                <span className="block text-[14px] font-semibold text-[var(--ink)]">
                  {tab === "parents" ? "Parents can see this" : "Students can see this"}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--ink-faint)]">
                  {custom
                    ? tab === "parents"
                      ? "Every parent in this organization can open it. This does not include students."
                      : "Every student in this organization can open it. This does not include parents."
                    : folderId == null && target.kind === "item"
                      ? "This isn’t in a folder, so families can’t open it until you turn off inherit."
                      : "This matches the folder above. Turn off inherit to change it."}
                </span>
              </span>
            </label>

            <div className="mt-4">
              <p className="text-[13px] font-bold text-[var(--ink-soft)]">
                {tab === "parents" ? "Specific parents" : "Specific students"}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ink-faint)]">
                {custom
                  ? "Can view opens it for that person. Can edit lets them change it."
                  : "These people are set on the folder this follows."}
              </p>
              <GrantList
                grants={tabGrants}
                emptyLabel={
                  !peopleQuery.isSuccess || (followsSource && sourceGrantsQuery.isLoading)
                    ? "Loading people…"
                    : tab === "parents"
                      ? "No extra parents."
                      : "No extra students."
                }
                editable={custom}
                pending={changeGrant.isPending || removeGrant.isPending}
                onPermission={(grant, next) =>
                  changeGrant.mutate({
                    granteeUserId: grant.granteeUserId,
                    permission: next,
                  })
                }
                onRemove={(grant) => removeGrant.mutate(grant.id)}
              />
              {custom ? (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <Select
                    wrapperClassName="min-w-[10rem] flex-1"
                    value={personId}
                    onChange={(event) => setPersonId(event.target.value)}
                  >
                    <option value="">
                      {tab === "parents" ? "Add a parent" : "Add a student"}
                    </option>
                    {grantable.map((person) => (
                      <option key={person.userId} value={person.userId}>
                        {person.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={permission}
                    onChange={(event) =>
                      setPermission(event.target.value === "write" ? "write" : "read")
                    }
                  >
                    <option value="read">Can view</option>
                    <option value="write">Can edit</option>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!personId || addGrant.isPending}
                    onClick={() => addGrant.mutate()}
                  >
                    <PlusIcon className="h-4 w-4" aria-hidden />
                    Add
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {otherGrants.length > 0 ? (
            <div className="mt-4">
              <p className="text-[13px] font-bold text-[var(--ink-soft)]">Other people</p>
              <GrantList
                grants={otherGrants}
                emptyLabel=""
                editable={custom}
                pending={changeGrant.isPending || removeGrant.isPending}
                onPermission={(grant, next) =>
                  changeGrant.mutate({
                    granteeUserId: grant.granteeUserId,
                    permission: next,
                  })
                }
                onRemove={(grant) => removeGrant.mutate(grant.id)}
              />
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 text-[13.5px] text-[var(--amber-deep)]">{error}</p>
          ) : null}
        </div>

        <div className="border-t border-[var(--line-soft)] bg-[var(--surface)] px-5 py-4">
          {accessCards.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {accessCards.map((label) => (
                <p
                  key={label}
                  className="rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--ink)]"
                >
                  {label}
                </p>
              ))}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              <XMarkIcon className="h-4 w-4" aria-hidden />
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saveAcl.isPending}
              onClick={() => saveAcl.mutate()}
            >
              <CheckIcon className="h-4 w-4" aria-hidden />
              {saveAcl.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function tabRoleToAudience(role: OrgRole): NamedResourceGrant["audience"] {
  if (role === "parent") return "parent";
  if (role === "student") return "student";
  return "other";
}

function namedGrant(
  grant: ResourceGrantRecord,
  person: { name: string; role: OrgRole } | undefined,
): NamedResourceGrant & { id: number; granteeUserId: string } {
  return {
    id: grant.id,
    granteeUserId: grant.granteeUserId,
    name: person?.name ?? "Someone in this organization",
    permission: grant.permission,
    audience: person ? tabRoleToAudience(person.role) : "other",
  };
}

function GrantList({
  grants,
  emptyLabel,
  editable,
  pending,
  onPermission,
  onRemove,
}: {
  grants: Array<NamedResourceGrant & { id: number; granteeUserId: string }>;
  emptyLabel: string;
  editable: boolean;
  pending: boolean;
  onPermission: (
    grant: NamedResourceGrant & { id: number; granteeUserId: string },
    permission: ResourceGrantPermission,
  ) => void;
  onRemove: (grant: NamedResourceGrant & { id: number; granteeUserId: string }) => void;
}) {
  if (grants.length === 0) {
    return emptyLabel ? (
      <p className="mt-2 text-[13.5px] text-[var(--ink-faint)]">{emptyLabel}</p>
    ) : null;
  }
  return (
    <ul className="mt-2 divide-y divide-[var(--line-soft)]">
      {grants.map((grant) => (
        <li
          key={grant.id}
          className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13.5px]"
        >
          <span className="min-w-0 font-bold text-[var(--ink)]">{grant.name}</span>
          {editable ? (
            <span className="flex items-center gap-2">
              <Select
                size="compact"
                value={grant.permission}
                disabled={pending}
                aria-label={`Access for ${grant.name}`}
                onChange={(event) =>
                  onPermission(grant, event.target.value === "write" ? "write" : "read")
                }
              >
                <option value="read">Can view</option>
                <option value="write">Can edit</option>
              </Select>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => onRemove(grant)}
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
                Remove
              </Button>
            </span>
          ) : (
            <span className="text-[var(--ink-soft)]">
              {grant.permission === "write" ? "Can edit" : "Can view"}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
