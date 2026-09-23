import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { Button, ButtonLink } from "@/ui/Button";
import { Wordmark } from "@/ui/Wordmark";
import { PageLoading } from "@/ui/PageLoading";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { InvitePreview } from "@/organizations/databridge/staffInvites";
import { mismatchedInvitePrompt } from "@/organizations/model/inviteClaim";

export function ClaimInviteCard({
  loading,
  loadError: _loadError,
  notFound,
  invite,
  alreadyAccepted,
  signedIn,
  signedInEmail,
  needsAccount,
  wrongAccount,
  signupHref,
  loginHref,
  canAccept,
  claiming,
  claimError,
  signingOut,
  signOutError,
  onAccept,
  onOpenOrg,
  onSignOut,
}: {
  loading: boolean;
  loadError: string | null;
  notFound: boolean;
  invite: InvitePreview | null;
  alreadyAccepted: boolean;
  signedIn: boolean;
  signedInEmail: string | null;
  needsAccount: boolean;
  wrongAccount: boolean;
  signupHref: string;
  loginHref: string;
  canAccept: boolean;
  claiming: boolean;
  claimError: string | null;
  signingOut: boolean;
  signOutError: string | null;
  onAccept: () => void;
  onOpenOrg: () => void;
  onSignOut: () => void;
}) {
  const isFamily = invite?.role === "parent" || invite?.role === "student";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4 py-12">
      <div
        className="w-full max-w-[360px] rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-5 py-6"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="mb-4 text-center">
          <Wordmark to={signedIn ? "/my" : "/"} size="login" />
        </div>
        <h1
          className="mb-1 text-center text-2xl font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Organization invite
        </h1>
        <p className="mb-5 text-center text-[13.5px] text-[var(--ink-soft)]">
          {isFamily
            ? invite?.role === "student"
              ? "You were invited to sign in and see your own course materials."
              : "You were invited to view course materials for a student."
            : "You were invited to help run an organization."}
        </p>

        {loading ? (
          <PageLoading embedded label="Loading invite…" />
        ) : null}

        {notFound ? (
          <p className="text-center text-[14px] leading-relaxed text-[var(--ink-soft)]">
            This invite is missing or no longer valid. Ask for a new link.
          </p>
        ) : null}

        {invite ? (
          <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-4">
            <p className="text-[15.5px] font-extrabold text-[var(--ink)]">
              {invite.organizationName}
            </p>
            {isFamily && invite.studentName ? (
              <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
                For {invite.studentName}
              </p>
            ) : null}
            <p className="mt-2">
              <Badge variant={roleBadgeVariant(invite.role)}>{roleLabel(invite.role)}</Badge>
            </p>
          </div>
        ) : null}

        {needsAccount && invite ? (
          <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            This invite is for{" "}
            <span className="font-bold text-[var(--ink)]">{invite.email}</span>. Create an
            account with that address — or sign in if you already have one.
          </p>
        ) : null}

        {wrongAccount && invite ? (
          <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            {signedInEmail ? (
              <>
                You’re signed in as{" "}
                <span className="font-bold text-[var(--ink)]">{signedInEmail}</span>. This
                invite is for{" "}
                <span className="font-bold text-[var(--ink)]">{invite.email}</span>. Sign
                out, then use that address.
              </>
            ) : (
              mismatchedInvitePrompt({
                invitedEmail: invite.email,
                signedInEmail,
              })
            )}
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

        {signOutError ? (
          <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
            {signOutError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2">
          {needsAccount ? (
            <>
              <ButtonLink to={signupHref} fullWidth>
                Create account
              </ButtonLink>
              <ButtonLink to={loginHref} variant="secondary" fullWidth>
                Sign in
              </ButtonLink>
            </>
          ) : null}
          {wrongAccount ? (
            <Button onClick={onSignOut} disabled={signingOut} fullWidth>
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          ) : null}
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
          {signedIn ? (
            <p className="text-center text-[13px]">
              <Link
                to="/my"
                className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              >
                Back to organizations
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
