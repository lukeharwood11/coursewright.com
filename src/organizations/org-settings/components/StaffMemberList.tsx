import { useId, useRef, useState } from "react";
import { EllipsisHorizontalIcon, MinusIcon } from "@heroicons/react/24/outline";
import { UserCard } from "@/organizations/user-card/UserCard";
import { Badge } from "@/ui/Badge";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Select } from "@/ui/Select";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { StaffMemberRow } from "../hooks/useOrgStaff";

const menuTriggerClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-not-allowed disabled:opacity-60";

const destructiveMenuItemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[#c42b2b] hover:bg-[#fde8e8] hover:text-[#a82424] focus-visible:bg-[#fde8e8] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60";

function CollaboratorActionsMenu({
  displayName,
  busy,
  removing,
  onRemove,
}: {
  displayName: string;
  busy: boolean;
  removing: boolean;
  onRemove: () => void;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={menuTriggerClassName}
        aria-label={`Actions for ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={busy}
        onClick={() => setOpen((value) => !value)}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </button>

      <AnchoredPopup
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        id={menuId}
        label={`Actions for ${displayName}`}
        preferredAlign="end"
        className="min-w-[12rem]"
      >
        <div className="py-1" role="menu">
          <button
            type="button"
            role="menuitem"
            className={destructiveMenuItemClassName}
            disabled={removing}
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            <MinusIcon className="h-4 w-4 shrink-0" aria-hidden />
            {removing ? "Removing…" : "Remove from collaborators"}
          </button>
        </div>
      </AnchoredPopup>
    </>
  );
}

export function StaffMemberList({
  orgSlug,
  members,
  changingId,
  removingId,
  onChangeRole,
  onRemove,
}: {
  orgSlug: string;
  members: StaffMemberRow[];
  changingId: number | null;
  removingId: number | null;
  onChangeRole: (member: StaffMemberRow, nextRole: string) => void;
  onRemove: (member: StaffMemberRow) => void;
}) {
  const [pendingRemove, setPendingRemove] = useState<StaffMemberRow | null>(null);

  if (members.length === 0) {
    return (
      <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
        No owners, admins, instructors, or parents yet.
      </p>
    );
  }

  const pendingName = pendingRemove
    ? pendingRemove.name || pendingRemove.email
    : "";

  return (
    <>
      <ul className="mt-3 divide-y divide-[var(--line-soft)]">
        {members.map((member) => {
          const displayName = member.name || member.email;
          const busy =
            changingId === member.membershipId || removingId === member.membershipId;

          return (
            <li
              key={member.membershipId}
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-3 sm:py-3"
            >
              <div className="min-w-0 sm:flex-1">
                <UserCard
                  orgSlug={orgSlug}
                  orgProfileId={member.orgProfileId}
                  userId={member.userId}
                  name={displayName}
                />
                {member.isYou ? (
                  <p className="pl-11 text-[12.5px] font-bold text-[var(--ink-faint)]">
                    You
                  </p>
                ) : null}
                {member.name && member.email ? (
                  <p className="truncate pl-11 text-[12.5px] text-[var(--ink-faint)]">
                    {member.email}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {member.canChangeRole ? (
                    <label>
                      <span className="sr-only">Role for {displayName}</span>
                      <Select
                        size="compact"
                        value={member.role}
                        disabled={busy}
                        onChange={(event) => onChangeRole(member, event.target.value)}
                      >
                        {member.changeRoles.map((option) => (
                          <option key={option} value={option}>
                            {roleLabel(option)}
                          </option>
                        ))}
                      </Select>
                    </label>
                  ) : (
                    <Badge variant={roleBadgeVariant(member.role)}>
                      {roleLabel(member.role)}
                    </Badge>
                  )}
                  {member.hasLinkedStudent && member.role !== "parent" ? (
                    <Badge variant="neutral">Parent</Badge>
                  ) : null}
                  {member.hasStudentAccount && member.role !== "student" ? (
                    <Badge variant="neutral">Student</Badge>
                  ) : null}
                </div>

                {member.canRemove ? (
                  <CollaboratorActionsMenu
                    displayName={displayName}
                    busy={busy}
                    removing={removingId === member.membershipId}
                    onRemove={() => setPendingRemove(member)}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title="Remove collaborator?"
        body={
          pendingRemove?.releaseTo === "parent"
            ? `${pendingName} will no longer be staff. They stay a parent.`
            : pendingRemove?.releaseTo === "student"
              ? `${pendingName} will no longer be staff. They stay a student.`
              : pendingRemove?.isYou
                ? "You’ll no longer be a collaborator in this organization until someone invites you again."
                : `${pendingName} will no longer be a collaborator in this organization until you invite them again.`
        }
        confirmLabel="Remove"
        cancelLabel="Keep them"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) return;
          const member = pendingRemove;
          setPendingRemove(null);
          onRemove(member);
        }}
      />
    </>
  );
}
