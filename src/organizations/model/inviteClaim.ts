import { inviteAuthPath } from "@/auth/model/inviteAuth";
import { invitePath } from "./staffInvite";

export function inviteSignupHref(token: string, email: string): string {
  return inviteAuthPath("/signup", { nextPath: invitePath(token), email });
}

export function inviteLoginHref(token: string, email: string): string {
  return inviteAuthPath("/login", { nextPath: invitePath(token), email });
}

export function unsignedInvitePrompt(email: string): string {
  return `This invite is for ${email}. Create an account with that address — or sign in if you already have one.`;
}

export function mismatchedInvitePrompt(input: {
  invitedEmail: string;
  signedInEmail: string | null;
}): string {
  if (input.signedInEmail) {
    return `You’re signed in as ${input.signedInEmail}. This invite is for ${input.invitedEmail}. Sign out, then use that address.`;
  }
  return `This invite is for ${input.invitedEmail}. Sign in with that email to accept.`;
}
