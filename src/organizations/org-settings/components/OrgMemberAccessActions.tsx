import {
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  MinusIcon,
  NoSymbolIcon,
  UserCircleIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { orgPersonProfilePath } from "@/organizations/model/paths";
import type { ExclusiveRelease } from "@/organizations/model/staffAccount";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { AnchoredPopup, type Rect } from "@/ui/AnchoredPopup";
import type { OrgPeopleMemberRow } from "../hooks/useOrgPeople";
import type { StaffMemberRow } from "../hooks/useOrgStaff";

const itemClassName =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-[var(--ink)] hover:bg-[var(--green-tint)]";

const destructiveItemClassName =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-[var(--amber-deep)] hover:bg-[var(--amber-tint)]";

export type OrgMemberAccessActionsModel = {
  displayName: string;
  orgSlug: string;
  orgProfileId: number | null;
  canSuspend: boolean;
  canReactivate: boolean;
  canRemoveFromOrg: boolean;
  canRemoveAsCollaborator?: boolean;
  collaboratorReleaseTo?: ExclusiveRelease;
  busy?: boolean;
  onSuspend: () => void;
  onReactivate: () => void;
  onRemoveFromOrg: () => void;
  onRemoveAsCollaborator?: () => void;
};

function removeCollaboratorConfirmBody(
  displayName: string,
  releaseTo: ExclusiveRelease,
): string {
  if (releaseTo === "parent") {
    return `${displayName} will lose staff access here. They’ll stay a parent in this organization.`;
  }
  if (releaseTo === "student") {
    return `${displayName} will lose staff access here. They’ll stay a student in this organization.`;
  }
  return `${displayName} will no longer be a collaborator in this organization. They can be invited again later.`;
}

export function orgMemberAccessModelFromPeopleRow(
  orgSlug: string,
  member: OrgPeopleMemberRow,
  handlers: {
    onSuspend: (member: OrgPeopleMemberRow) => void;
    onReactivate: (member: OrgPeopleMemberRow) => void;
    onRemoveFromOrg: (member: OrgPeopleMemberRow) => void;
  },
  options?: {
    staff?: StaffMemberRow | null;
    onRemoveAsCollaborator?: (staff: StaffMemberRow) => void;
  },
): OrgMemberAccessActionsModel {
  const staff = options?.staff;
  const canRemoveAsCollaborator =
    member.status === "active" && Boolean(staff?.canRemove);

  return {
    displayName: member.name || member.email,
    orgSlug,
    orgProfileId: member.orgProfileId,
    canSuspend: member.canSuspend,
    canReactivate: member.canReactivate,
    canRemoveFromOrg: member.canRemoveFromOrg,
    canRemoveAsCollaborator,
    collaboratorReleaseTo: staff?.releaseTo ?? null,
    onSuspend: () => handlers.onSuspend(member),
    onReactivate: () => handlers.onReactivate(member),
    onRemoveFromOrg: () => handlers.onRemoveFromOrg(member),
    onRemoveAsCollaborator:
      canRemoveAsCollaborator && staff && options?.onRemoveAsCollaborator
        ? () => options.onRemoveAsCollaborator!(staff)
        : undefined,
  };
}

function contextMenuRect(event: MouseEvent): Rect {
  return {
    top: event.clientY,
    left: event.clientX,
    width: 0,
    height: 0,
  };
}

type AccessActionsSlot = {
  contextMenuProps: { onContextMenu: (event: MouseEvent) => void };
  trigger: ReactNode;
};

export function OrgMemberAccessActions({
  displayName,
  orgSlug,
  orgProfileId,
  canSuspend,
  canReactivate,
  canRemoveFromOrg,
  canRemoveAsCollaborator = false,
  collaboratorReleaseTo = null,
  busy = false,
  onSuspend,
  onReactivate,
  onRemoveFromOrg,
  onRemoveAsCollaborator,
  children,
}: OrgMemberAccessActionsModel & {
  children?: (slot: AccessActionsSlot) => ReactNode;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmRemoveCollaborator, setConfirmRemoveCollaborator] = useState(false);

  const profilePath =
    orgProfileId != null ? orgPersonProfilePath(orgSlug, orgProfileId) : null;
  const hasMenu =
    canSuspend ||
    canReactivate ||
    canRemoveAsCollaborator ||
    canRemoveFromOrg ||
    profilePath != null;

  function openFromButton() {
    setAnchorRect(null);
    setOpen((value) => !value);
  }

  function openFromContext(event: MouseEvent) {
    if (!hasMenu) return;
    event.preventDefault();
    event.stopPropagation();
    setAnchorRect(contextMenuRect(event));
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    setAnchorRect(null);
  }

  const trigger = hasMenu ? (
    <Button
      ref={buttonRef}
      type="button"
      variant="secondary"
      disabled={busy}
      aria-label={`Actions for ${displayName}`}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      onClick={openFromButton}
    >
      Actions
      <ChevronDownIcon className="h-4 w-4" aria-hidden />
    </Button>
  ) : null;

  const slot: AccessActionsSlot = {
    contextMenuProps: { onContextMenu: openFromContext },
    trigger,
  };

  const overlays = hasMenu ? (
    <>
      <AnchoredPopup
        open={open}
        onClose={closeMenu}
        anchorRef={anchorRect ? undefined : buttonRef}
        anchorRect={anchorRect}
        id={menuId}
        label={`Actions for ${displayName}`}
        preferredAlign="end"
        className="min-w-[12rem]"
      >
        <div className="py-1" role="menu">
          {profilePath ? (
            <Link
              role="menuitem"
              to={profilePath}
              className={itemClassName}
              onClick={closeMenu}
            >
              <UserCircleIcon className="h-4 w-4 shrink-0" aria-hidden />
              Profile
            </Link>
          ) : null}
          {canSuspend ? (
            <button
              type="button"
              role="menuitem"
              className={itemClassName}
              onClick={() => {
                closeMenu();
                setConfirmSuspend(true);
              }}
            >
              <NoSymbolIcon className="h-4 w-4 shrink-0" aria-hidden />
              Suspend access
            </button>
          ) : null}
          {canReactivate ? (
            <button
              type="button"
              role="menuitem"
              className={itemClassName}
              onClick={() => {
                closeMenu();
                onReactivate();
              }}
            >
              <ArrowPathIcon className="h-4 w-4 shrink-0" aria-hidden />
              Restore access
            </button>
          ) : null}
          {canRemoveAsCollaborator && onRemoveAsCollaborator ? (
            <button
              type="button"
              role="menuitem"
              className={itemClassName}
              onClick={() => {
                closeMenu();
                setConfirmRemoveCollaborator(true);
              }}
            >
              <UserMinusIcon className="h-4 w-4 shrink-0" aria-hidden />
              Remove as collaborator
            </button>
          ) : null}
          {canRemoveFromOrg ? (
            <button
              type="button"
              role="menuitem"
              className={destructiveItemClassName}
              onClick={() => {
                closeMenu();
                setConfirmRemove(true);
              }}
            >
              <MinusIcon className="h-4 w-4 shrink-0" aria-hidden />
              Remove from org
            </button>
          ) : null}
        </div>
      </AnchoredPopup>

      <ConfirmDialog
        open={confirmSuspend}
        title="Suspend access?"
        body={`${displayName} won’t be able to open this organization until you restore their access. Their roster and profile records stay in place.`}
        confirmLabel="Suspend access"
        cancelLabel="Keep access"
        onCancel={() => setConfirmSuspend(false)}
        onConfirm={() => {
          setConfirmSuspend(false);
          onSuspend();
        }}
      />

      <ConfirmDialog
        open={confirmRemoveCollaborator}
        title="Remove as collaborator?"
        body={removeCollaboratorConfirmBody(displayName, collaboratorReleaseTo)}
        confirmLabel="Remove as collaborator"
        cancelLabel="Keep collaborator"
        onCancel={() => setConfirmRemoveCollaborator(false)}
        onConfirm={() => {
          setConfirmRemoveCollaborator(false);
          onRemoveAsCollaborator?.();
        }}
      />

      <ConfirmDialog
        open={confirmRemove}
        title="Remove from organization?"
        body={`${displayName} will lose all access to this organization, including parent or student access. Their login will be unlinked from their org profile here. Roster records and links stay unless you remove them separately.`}
        confirmLabel="Remove from org"
        cancelLabel="Keep them"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          onRemoveFromOrg();
        }}
      />
    </>
  ) : null;

  if (children) {
    return (
      <>
        {children(slot)}
        {overlays}
      </>
    );
  }

  if (!hasMenu) return null;

  return (
    <>
      {trigger}
      {overlays}
    </>
  );
}
