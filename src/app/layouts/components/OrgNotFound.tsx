import { Link } from "react-router-dom";
import { ButtonLink } from "@/ui/Button";
import { Wordmark } from "@/ui/Wordmark";

export function OrgNotFound({ error }: { error: string | null }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-5 py-16">
      <Wordmark to="/my" size="nav" />
      <h1
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        We couldn’t find that organization
      </h1>
      <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        The web address may have changed, or you may not be a member. Choose an
        organization you belong to.
      </p>
      {error ? (
        <p className="text-[13px] text-[var(--amber-deep)]">{error}</p>
      ) : null}
      <ButtonLink to="/my" variant="secondary">
        Back to organizations
      </ButtonLink>
      <p className="text-[13px]">
        <Link
          to="/my/settings"
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Account settings
        </Link>
      </p>
    </main>
  );
}
