import { safeNextPath } from "./safeNext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteAuthMode = "login" | "signup";

export type InviteAuthContext = {
  fromInvite: boolean;
  invitedEmail: string | null;
};

export function invitedEmailFromSearch(search: string): string | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const raw = params.get("email")?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(raw)) return null;
  return raw;
}

export function isInviteNextPath(next: string | null | undefined): boolean {
  return safeNextPath(next).startsWith("/invite/");
}

export function inviteAuthFromSearch(search: string): InviteAuthContext {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return {
    fromInvite: isInviteNextPath(params.get("next")),
    invitedEmail: invitedEmailFromSearch(search),
  };
}

export function inviteAuthPath(
  pathname: "/login" | "/signup",
  input: { nextPath: string; email: string },
): string {
  const params = new URLSearchParams();
  params.set("next", safeNextPath(input.nextPath));
  const email = input.email.trim().toLowerCase();
  if (EMAIL_RE.test(email)) params.set("email", email);
  return `${pathname}?${params.toString()}`;
}

export function inviteAuthSubcopy(
  mode: InviteAuthMode,
  ctx: InviteAuthContext,
): string {
  if (ctx.invitedEmail) {
    return mode === "signup"
      ? "Create an account with the address this invite was sent to."
      : "Sign in with the address this invite was sent to.";
  }
  if (ctx.fromInvite) {
    return mode === "signup"
      ? "Create an account with the email you were invited with."
      : "Sign in with the email you were invited with to accept.";
  }
  return mode === "signup"
    ? "Plan courses, share materials, and print from one place."
    : "Sign in to see your courses and materials.";
}

export function inviteAuthCalloutAction(mode: InviteAuthMode): string {
  return mode === "signup"
    ? "Create your account with that address."
    : "Sign in with that address.";
}

export function inviteAuthGoogleHint(ctx: InviteAuthContext): string | null {
  if (ctx.invitedEmail) {
    return `If you use Google, pick the account for ${ctx.invitedEmail}.`;
  }
  if (ctx.fromInvite) {
    return "If you use Google, pick the account for the invited email.";
  }
  return null;
}
