import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Wordmark } from "@/ui/Wordmark";
import { isNetworkError } from "@/ui/networkError";
import { toastCheckNetworkConnection } from "@/ui/toast";
import { AuthHcaptchaWidget, useAuthHcaptcha } from "@/auth/components/AuthHcaptcha";
import { friendlyCaptchaAuthError } from "@/auth/model/captchaAuthError";
import { GoogleMark } from "./GoogleMark";
import { signInWithEmail } from "@/auth/api/signInWithEmail";
import { signInWithPassword } from "@/auth/api/signInWithPassword";
import { signInWithGoogle } from "@/auth/api/signInWithGoogle";
import {
  beginPasswordSignUp,
  completePasswordSignUp,
} from "@/auth/api/signUpWithPassword";
import { isSignUpPendingNameStep } from "@/auth/model/signUpPending";
import { validateSignUpName } from "@/auth/model/signUpName";
import { safeNextPath } from "@/auth/model/safeNext";
import { isSupabaseConfigured } from "@/infrastructure/supabase/client";

function friendlySignInError(message: string): string {
  const captcha = friendlyCaptchaAuthError(message);
  if (captcha) return captcha;
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Check your email for a verification link, then sign in.";
  }
  return message;
}

export function AuthScreen({
  heading,
  subcopy,
  submitLabel,
  googleLabel,
  footer,
  passwordSignIn = false,
  passwordSignUp = false,
  magicLinkLabel = "Email me a sign-in link",
  initialEmail = "",
  invitedEmail = null,
  inviteCalloutAction = null,
  googleHint = null,
}: {
  heading: string;
  subcopy: string;
  submitLabel: string;
  googleLabel: string;
  footer: ReactNode;
  /** Login only: email + password primary, magic link as a secondary action. */
  passwordSignIn?: boolean;
  /** Signup: email + password creates an account and signs the person in. */
  passwordSignUp?: boolean;
  magicLinkLabel?: string;
  initialEmail?: string;
  invitedEmail?: string | null;
  inviteCalloutAction?: string | null;
  googleHint?: string | null;
}) {
  const location = useLocation();
  const nextPath = safeNextPath(new URLSearchParams(location.search).get("next"));
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [signUpStep, setSignUpStep] = useState<"credentials" | "name">(() =>
    passwordSignUp && isSignUpPendingNameStep() ? "name" : "credentials",
  );
  const showPassword = passwordSignIn || passwordSignUp;
  const onSignUpNameStep = passwordSignUp && signUpStep === "name";
  const { configured: hcaptchaOn, widgetRef, handle: hcaptcha } = useAuthHcaptcha();

  async function captchaTokenForAuth(): Promise<string | undefined> {
    if (!hcaptchaOn) return undefined;
    const token = await hcaptcha.getToken();
    if (!token) {
      setMessage("We couldn’t run the security check. Try again.");
    }
    return token;
  }

  function showError(error: string) {
    hcaptcha.reset();
    if (isNetworkError(error)) {
      toastCheckNetworkConnection();
      return;
    }
    setMessage(error);
  }

  async function onGoogle() {
    setBusy(true);
    setMessage(null);
    const result = await signInWithGoogle(nextPath);
    if (result.error) showError(result.error);
    setBusy(false);
  }

  async function sendMagicLink() {
    if (!email.trim()) {
      setMessage("Enter your email to get a sign-in link.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const captchaToken = await captchaTokenForAuth();
    if (hcaptchaOn && !captchaToken) {
      setBusy(false);
      return;
    }
    const result = await signInWithEmail(email.trim(), nextPath, captchaToken);
    if (result.error) showError(result.error);
    else {
      hcaptcha.reset();
      setMessage("Check your email for a sign-in link.");
    }
    setBusy(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordSignUp) {
      if (signUpStep === "credentials") {
        if (!password) {
          setMessage("Choose a password to create your account.");
          return;
        }
        setBusy(true);
        setMessage(null);
        const beginResult = await beginPasswordSignUp(
          email.trim(),
          password,
          nextPath,
          hcaptchaOn ? () => hcaptcha.getToken() : undefined,
        );
        if (beginResult.error) showError(beginResult.error);
        else {
          hcaptcha.reset();
          setSignUpStep("name");
        }
        setBusy(false);
        return;
      }

      const nameResult = validateSignUpName({ firstName, lastName });
      if (!nameResult.ok) {
        setMessage(nameResult.error);
        return;
      }
      setBusy(true);
      setMessage(null);
      const result = await completePasswordSignUp(nameResult.value);
      if (result.error) showError(result.error);
      else if (result.needsEmailVerification) setAwaitingEmailVerification(true);
      setBusy(false);
      return;
    }

    if (!passwordSignIn) {
      await sendMagicLink();
      return;
    }

    setBusy(true);
    setMessage(null);
    const captchaToken = await captchaTokenForAuth();
    if (hcaptchaOn && !captchaToken) {
      setBusy(false);
      return;
    }
    const result = await signInWithPassword(email.trim(), password, captchaToken);
    if (result.error) showError(friendlySignInError(result.error));
    else hcaptcha.reset();
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4 py-12">
      <div
        className="w-full max-w-[320px] rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-5 py-6"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="mb-4 text-center">
          <Wordmark to="/" size="login" />
        </div>

        {awaitingEmailVerification ? (
          <div role="status">
            <h1
              className="mb-1 text-center text-2xl font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Account created!
            </h1>
            <p className="mb-4 text-center text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
              Check your mailbox to verify your email. Open the link we sent to{" "}
              <span className="font-bold text-[var(--ink)]">{email.trim()}</span>, then
              you’ll be on your way.
            </p>
            <p className="rounded-[6px] bg-[var(--green-tint)] px-3 py-2 text-center text-[13px] leading-relaxed text-[var(--green-deep)]">
              Didn’t get it? Check spam, or wait a minute and try again from sign in.
            </p>
            <p className="mt-6 text-center text-[12px] text-[var(--ink-faint)]">
              Already verified?{" "}
              <Link
                to={{ pathname: "/login", search: location.search }}
                className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              >
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <h1
              className="mb-1 text-center text-2xl font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {onSignUpNameStep ? "Your name" : heading}
            </h1>
            <p className="mb-5 text-center text-[13.5px] text-[var(--ink-soft)]">
              {onSignUpNameStep
                ? "We’ll use this as your display name across Course Wright."
                : subcopy}
            </p>

            {invitedEmail && !onSignUpNameStep ? (
              <p className="mb-4 rounded-[6px] bg-[var(--green-tint)] px-3 py-2 text-center text-[13px] leading-relaxed text-[var(--green-deep)]">
                This invite is for{" "}
                <span className="font-bold">{invitedEmail}</span>.{" "}
                {inviteCalloutAction}
              </p>
            ) : null}

            {!isSupabaseConfigured && (
              <p className="mb-4 flex gap-2 rounded-[6px] bg-[var(--amber-tint)] px-3 py-2 text-[12.5px] text-[var(--amber-deep)]">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <span>
                  Accounts aren’t connected yet. Add Supabase URL and anon key to{" "}
                  <code>.env.testing</code>.
                </span>
              </p>
            )}

            {!onSignUpNameStep && (
              <>
                <Button variant="google" disabled={busy} onClick={onGoogle} fullWidth>
                  <GoogleMark />
                  {googleLabel}
                </Button>
                {googleHint ? (
                  <p className="mt-2 text-center text-[12.5px] leading-relaxed text-[var(--ink-soft)]">
                    {googleHint}
                  </p>
                ) : null}

                <div className="my-4 flex items-center gap-3 text-[12px] text-[var(--ink-faint)]">
                  <span className="h-px flex-1 bg-[var(--line)]" />
                  or
                  <span className="h-px flex-1 bg-[var(--line)]" />
                </div>
              </>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              {onSignUpNameStep ? (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                      First name
                    </span>
                    <Input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                      Last name
                    </span>
                    <Input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="text-[13px] font-bold text-[var(--ink-soft)]">Email</span>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {invitedEmail ? (
                      <span className="text-[12.5px] leading-relaxed text-[var(--ink-soft)]">
                        Use {invitedEmail} — the address on the invite.
                      </span>
                    ) : null}
                  </label>
                  {showPassword && (
                    <label className="flex flex-col gap-1">
                      <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                        Password
                      </span>
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={passwordSignUp ? "new-password" : "current-password"}
                        minLength={passwordSignUp ? 6 : undefined}
                      />
                    </label>
                  )}
                </>
              )}
              <Button type="submit" disabled={busy} fullWidth>
                {passwordSignUp && signUpStep === "credentials" ? "Continue" : submitLabel}
              </Button>
              {onSignUpNameStep && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  fullWidth
                  onClick={() => {
                    setMessage(null);
                    setSignUpStep("credentials");
                  }}
                >
                  Back
                </Button>
              )}
              {passwordSignIn && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  fullWidth
                  onClick={() => void sendMagicLink()}
                >
                  {magicLinkLabel}
                </Button>
              )}
            </form>

            {message && (
              <p className="mt-4 text-[12.5px] text-[var(--ink-soft)]" role="status">
                {message}
              </p>
            )}

            <div className="mt-6 text-center text-[12px] text-[var(--ink-faint)]">{footer}</div>
            <AuthHcaptchaWidget widgetRef={widgetRef} />
          </>
        )}
      </div>
    </main>
  );
}
