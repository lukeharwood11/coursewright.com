import { useState } from "react";
import { UserCard } from "@/organizations/user-card/UserCard";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { StaffMemberRow } from "../hooks/useOrgStaff";

export function StaffMemberList({
  orgSlug,
  members,
  changingId,
  removingId,
  savingContactId,
  onChangeRole,
  onRemove,
  onSaveContact,
}: {
  orgSlug: string;
  members: StaffMemberRow[];
  changingId: number | null;
  removingId: number | null;
  savingContactId: number | null;
  onChangeRole: (member: StaffMemberRow, nextRole: string) => void;
  onRemove: (member: StaffMemberRow) => void;
  onSaveContact: (member: StaffMemberRow, name: string, email?: string) => void;
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
            <li key={member.membershipId} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <UserCard
                  orgSlug={orgSlug}
                  userId={member.userId}
                  name={displayName}
                />
                {member.isYou ? (
                  <p className="pl-11 text-[12.5px] font-bold text-[var(--ink-faint)]">
                    You
                  </p>
                ) : null}
                {member.canEditOrgName ? (
                  <OrgContactEditor
                    member={member}
                    saving={savingContactId === member.membershipId}
                    onSave={onSaveContact}
                  />
                ) : member.name ? (
                  <p className="truncate pl-11 text-[12.5px] text-[var(--ink-faint)]">
                    {member.email}
                  </p>
                ) : null}
              </div>

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
                  <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
                )}
                {member.hasLinkedStudent && member.role !== "parent" ? (
                  <Badge variant="neutral">Parent</Badge>
                ) : null}
                {member.hasStudentAccount && member.role !== "student" ? (
                  <Badge variant="neutral">Student</Badge>
                ) : null}
              </div>

              {member.canRemove ? (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setPendingRemove(member)}
                >
                  {removingId === member.membershipId ? "Removing…" : "Remove"}
                </Button>
              ) : null}
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

function OrgContactEditor({
  member,
  saving,
  onSave,
}: {
  member: StaffMemberRow;
  saving: boolean;
  onSave: (member: StaffMemberRow, name: string, email?: string) => void;
}) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);

  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2 pl-11"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(member, name, member.canEditOrgEmail ? email : undefined);
      }}
    >
      <label className="min-w-[10rem] flex-1">
        <span className="mb-1 block text-[12px] font-bold text-[var(--ink-faint)]">
          Name in this organization
        </span>
        <Input
          value={name}
          disabled={saving}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      {member.canEditOrgEmail ? (
        <label className="min-w-[12rem] flex-1">
          <span className="mb-1 block text-[12px] font-bold text-[var(--ink-faint)]">
            Contact email
          </span>
          <Input
            type="email"
            value={email}
            disabled={saving}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
      ) : (
        <p className="truncate pb-3 text-[12.5px] text-[var(--ink-faint)]">{member.email}</p>
      )}
      <Button type="submit" variant="secondary" disabled={saving || name.trim().length === 0}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
