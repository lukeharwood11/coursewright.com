import type { FormEvent } from "react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import type { StaffInviteRole } from "@/organizations/model/role";
import { parseStaffInviteRole, roleLabel } from "@/organizations/model/role";

export function InviteStaffForm({
  name,
  email,
  role,
  roles,
  error,
  submitting,
  onNameChange,
  onEmailChange,
  onRoleChange,
  onSubmit,
}: {
  name: string;
  email: string;
  role: StaffInviteRole;
  roles: StaffInviteRole[];
  error: string | null;
  submitting: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: StaffInviteRole) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
            className="grid gap-3 lg:grid-cols-[1fr_1fr_10rem_auto]"
    >
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
        <Input
          className="w-full"
          required
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Alex Rivera"
          autoComplete="off"
        />
      </label>
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
        <Select
          wrapperClassName="w-full"
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
        </Select>
      </label>
      <div className="flex items-end">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          <UserPlusIcon className="h-5 w-5" aria-hidden />
          {submitting ? "Adding…" : "Add"}
        </Button>
      </div>
      {error ? (
        <p className="text-[13px] text-[var(--amber-deep)] lg:col-span-4" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
