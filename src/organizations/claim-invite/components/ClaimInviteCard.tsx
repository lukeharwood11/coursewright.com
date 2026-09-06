import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Wordmark } from "@/ui/Wordmark";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { StaffInvitePreview } from "@/organizations/databridge/staffInvites";

export function ClaimInviteCard({
  loading,
  loadError,
  notFound,
  invite,
  alreadyAccepted,
  canAccept,
  claiming,
  claimError,
  onAccept,
  onOpenOrg,
}: {
  loading: boolean;
  loadError: string | null;
  notFound: boolean;
  invite: StaffInvitePreview | null;
  alreadyAccepted: boolean;
  canAccept: boolean;
  claiming: boolean;
  claimError: string | null;
  onAccept: () => void;
  onOpenOrg: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4 py-12">
      <div
        className="w-full max-w-[360px] rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-5 py-6"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="mb-4 text-center">
          <Wordmark to="/my" size="login" />
        </div>
        <h1
          className="mb-1 text-center text-2xl font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Organization invite
        </h1>
        <p className="mb-5 text-center text-[13.5px] text-[var(--ink-soft)]">
          You were invited to help run an organization.
        </p>

        {loading ? (
          <p className="text-center text-[14px] text-[var(--ink-soft)]">Loading invite…</p>
        ) : null}

        {loadError ? (
          <p className="text-center text-[13.5px] text-[var(--amber-deep)]" role="alert">
            {loadError}
          </p>
        ) : null}

        {notFound ? (
          <p className="text-center text-[14px] leading-relaxed text-[var(--ink-soft)]">
            This invite is missing or no longer valid. Ask an owner or admin for a
            new link.
          </p>
        ) : null}

        {invite ? (
          <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-4">
            <p className="text-[15.5px] font-extrabold text-[var(--ink)]">
              {invite.organizationName}
            </p>
            <p className="mt-2">
              <Badge variant={roleBadgeVariant(invite.role)}>{roleLabel(invite.role)}</Badge>
            </p>
          </div>
        ) : null}

        {invite && !invite.emailMatches ? (
          <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            This invite is for <span className="font-bold text-[var(--ink)]">{invite.email}</span>.
            Sign in with that email to accept.
          </p>
        ) : null}

        {invite && alreadyAccepted && invite.emailMatches ? (
          <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            This invite was already accepted.
          </p>
        ) : null}

        {claimError ? (
          <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
            {claimError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2">
          {canAccept ? (
            <Button onClick={onAccept} disabled={claiming} fullWidth>
              {claiming ? "Accepting…" : "Accept invite"}
            </Button>
          ) : null}
          {invite && alreadyAccepted && invite.emailMatches ? (
            <Button onClick={onOpenOrg} fullWidth>
              Open {invite.organizationName}
            </Button>
          ) : null}
          <ButtonLinkLike />
        </div>
      </div>
    </main>
  );
}

function ButtonLinkLike() {
  return (
    <p className="text-center text-[13px]">
      <Link
        to="/my"
        className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
      >
        Back to organizations
      </Link>
    </p>
  );
}
