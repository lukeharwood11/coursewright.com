import type { FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import type { StaffInviteRole } from "@/organizations/model/role";
import { parseStaffInviteRole, roleLabel } from "@/organizations/model/role";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
  "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
].join(" ");

export function InviteStaffForm({
  email,
  role,
  roles,
  error,
  submitting,
  onEmailChange,
  onRoleChange,
  onSubmit,
}: {
  email: string;
  role: StaffInviteRole;
  roles: StaffInviteRole[];
  error: string | null;
  submitting: boolean;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: StaffInviteRole) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Email</span>
        <Input
          className="w-full"
          type="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="alex@example.com"
          autoComplete="off"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Role</span>
        <select
          className={controlClass}
          value={role}
          onChange={(event) => {
            const next = parseStaffInviteRole(event.target.value);
            if (next) onRoleChange(next);
          }}
        >
          {roles.map((option) => (
            <option key={option} value={option}>
              {roleLabel(option)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Inviting…" : "Invite"}
        </Button>
      </div>
      {error ? (
        <p className="text-[13px] text-[var(--amber-deep)] sm:col-span-3" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
