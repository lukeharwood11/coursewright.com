import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/Select";
import { listOrgPeople } from "@/organizations/databridge/memberships";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import {
  deleteResourceGrant,
  listFolderGrants,
  listItemGrants,
  resourceGrantQueryKeys,
  upsertResourceGrant,
} from "@/resources/databridge/grants";
import { updateResourceFolder } from "@/resources/databridge/folders";
import { updateResourceItem } from "@/resources/databridge/items";
import type { ResourceGrantRecord } from "@/resources/model/access";
import {
  RESOURCE_ACCESS_MODES,
  resourceAccessModeLabel,
  type ResourceAccessMode,
} from "@/resources/model/kinds";

type Target =
  | { kind: "folder"; id: number; organizationId: number; canInherit: boolean }
  | { kind: "item"; id: number; organizationId: number; canInherit: boolean };

export function AccessSettingsDialog({
  open,
  target,
  accessMode,
  aclInherit,
  onClose,
  onSaved,
}: {
  open: boolean;
  target: Target | null;
  accessMode: ResourceAccessMode;
  aclInherit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [inherit, setInherit] = useState(aclInherit);
  const [mode, setMode] = useState<ResourceAccessMode>(accessMode);
  const [personId, setPersonId] = useState("");
  const [permission, setPermission] = useState<"read" | "write">("read");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInherit(aclInherit);
    setMode(accessMode);
    setError(null);
  }, [aclInherit, accessMode, open, target?.id]);

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

  const people = peopleQuery.data ?? [];
  const grants = grantsQuery.data ?? [];
  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.userId, person])),
    [people],
  );
  const grantable = people.filter(
    (person) => !grants.some((grant) => grant.granteeUserId === person.userId),
  );

  const saveAcl = useMutation({
    mutationFn: async () => {
      if (!target) return;
      if (target.kind === "folder") {
        await updateResourceFolder(target.id, {
          accessMode: mode,
          aclInherit: target.canInherit ? inherit : false,
        });
      } else {
        await updateResourceItem(target.id, {
          accessMode: mode,
          aclInherit: target.canInherit ? inherit : false,
        });
      }
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (caught: Error) => setError(caught.message),
  });

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
      void queryClient.invalidateQueries({
        queryKey:
          target?.kind === "folder"
            ? resourceGrantQueryKeys.folder(target.id)
            : resourceGrantQueryKeys.item(target?.id ?? 0),
      });
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const removeGrant = useMutation({
    mutationFn: (id: number) => deleteResourceGrant(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey:
          target?.kind === "folder"
            ? resourceGrantQueryKeys.folder(target.id)
            : resourceGrantQueryKeys.item(target?.id ?? 0),
      });
    },
    onError: (caught: Error) => setError(caught.message),
  });

  if (!open || !target) return null;

  const showCustom = !target.canInherit || !inherit;

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
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id="resource-access-title"
          className="text-[15.5px] font-extrabold text-[var(--ink)]"
        >
          Manage access
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
          Choose who can open this when it’s published. Editors can always see drafts.
        </p>

        {target.canInherit ? (
          <label className="mt-4 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
              checked={inherit}
              onChange={(event) => setInherit(event.target.checked)}
            />
            <span>
              <span className="block text-[14px] font-semibold text-[var(--ink)]">
                Inherit folder access
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--ink-faint)]">
                People who can open the folder this is in can open this too. Turn
                this off to choose different people.
              </span>
            </span>
          </label>
        ) : null}

        {showCustom ? (
          <fieldset className="mt-4">
            <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
              Who can view
            </legend>
            <div className="mt-2 flex flex-col gap-2">
              {RESOURCE_ACCESS_MODES.map((value) => (
                <label key={value} className="flex items-center gap-2 text-[14px]">
                  <input
                    type="radio"
                    name="resource-access-mode"
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  {resourceAccessModeLabel(value)}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {showCustom ? (
          <div className="mt-5">
            <p className="text-[13px] font-bold text-[var(--ink-soft)]">
              Specific people
            </p>
            <ul className="mt-2 divide-y divide-[var(--line-soft)]">
              {grants.length === 0 ? (
                <li className="py-2 text-[13.5px] text-[var(--ink-faint)]">
                  No extra people yet.
                </li>
              ) : (
                grants.map((grant) => (
                  <GrantRow
                    key={grant.id}
                    grant={grant}
                    name={
                      peopleById.get(grant.granteeUserId)?.name ?? "Someone in this org"
                    }
                    onRemove={() => removeGrant.mutate(grant.id)}
                  />
                ))
              )}
            </ul>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Select
                wrapperClassName="min-w-[10rem] flex-1"
                value={personId}
                onChange={(event) => setPersonId(event.target.value)}
              >
                <option value="">Add a person</option>
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
                Add
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-[13.5px] text-[var(--amber-deep)]">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saveAcl.isPending}
            onClick={() => saveAcl.mutate()}
          >
            {saveAcl.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function GrantRow({
  grant,
  name,
  onRemove,
}: {
  grant: ResourceGrantRecord;
  name: string;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 py-2 text-[13.5px]">
      <span>
        <span className="font-bold text-[var(--ink)]">{name}</span>
        <span className="text-[var(--ink-soft)]">
          {grant.permission === "write" ? " · Can edit" : " · Can view"}
        </span>
      </span>
      <Button type="button" variant="secondary" onClick={onRemove}>
        Remove
      </Button>
    </li>
  );
}
