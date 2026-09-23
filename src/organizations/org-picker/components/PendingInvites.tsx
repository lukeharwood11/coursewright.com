import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { PendingOrgInvite } from "@/organizations/databridge/staffInvites";

export function PendingInvites({
  invites,
  acceptingId,
  error,
  onAccept,
}: {
  invites: PendingOrgInvite[];
  acceptingId: number | null;
  error: string | null;
  onAccept: (invite: PendingOrgInvite) => void;
}) {
  if (invites.length === 0) return null;

  const hasFamily = invites.some(
    (invite) => invite.role === "parent" || invite.role === "student",
  );
  const hasStaff = invites.some(
    (invite) => invite.role !== "parent" && invite.role !== "student",
  );

  return (
    <section className="mt-6">
      <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Invites</h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
        {hasFamily && hasStaff
          ? "Accept to join these organizations."
          : hasFamily
            ? "You were invited to view materials. Accept to join."
            : "Someone asked you to help run these organizations. Accept to join."}
      </p>
      {error ? (
        <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-3 flex flex-col gap-2">
        {invites.map((invite) => (
          <li
            key={invite.id}
            className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15.5px] font-extrabold text-[var(--ink)]">
                {invite.organization.name}
              </p>
              <p className="truncate text-[12.5px] text-[var(--ink-faint)]">
                /my/{invite.organization.slug}
              </p>
            </div>
            <Badge variant={roleBadgeVariant(invite.role)}>{roleLabel(invite.role)}</Badge>
            <Button
              onClick={() => onAccept(invite)}
              disabled={acceptingId === invite.id}
            >
              {acceptingId === invite.id ? "Accepting…" : "Accept"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
