import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Wordmark } from "@/ui/Wordmark";
import { GoogleMark } from "./GoogleMark";
import { signInWithEmail } from "@/auth/api/signInWithEmail";
import { signInWithPassword } from "@/auth/api/signInWithPassword";
import { signInWithGoogle } from "@/auth/api/signInWithGoogle";
import { signUpWithPassword } from "@/auth/api/signUpWithPassword";
import { safeNextPath } from "@/auth/model/safeNext";
import { isSupabaseConfigured } from "@/infrastructure/supabase/client";

export function AuthScreen({
  heading,
  subcopy,
  submitLabel,
  googleLabel,
  footer,
  passwordSignIn = false,
  passwordSignUp = false,
  magicLinkLabel = "Email me a sign-in link",
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
}) {
  const location = useLocation();
  const nextPath = safeNextPath(new URLSearchParams(location.search).get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const showPassword = passwordSignIn || passwordSignUp;

  async function onGoogle() {
    setBusy(true);
    setMessage(null);
    const result = await signInWithGoogle(nextPath);
    if (result.error) setMessage(result.error);
    setBusy(false);
  }

  async function sendMagicLink() {
    if (!email.trim()) {
      setMessage("Enter your email to get a sign-in link.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await signInWithEmail(email.trim(), nextPath);
    if (result.error) setMessage(result.error);
    else setMessage("Check your email for a sign-in link.");
    setBusy(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordSignUp) {
      if (!password) {
        setMessage("Choose a password to create your account.");
        return;
      }
      setBusy(true);
      setMessage(null);
      const result = await signUpWithPassword(email.trim(), password);
      if (result.error) setMessage(result.error);
      setBusy(false);
      return;
    }

    if (!passwordSignIn) {
      await sendMagicLink();
      return;
    }

    setBusy(true);
    setMessage(null);
    const result = await signInWithPassword(email.trim(), password);
    if (result.error) setMessage(result.error);
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
        <h1
          className="mb-1 text-center text-2xl font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {heading}
        </h1>
        <p className="mb-5 text-center text-[13.5px] text-[var(--ink-soft)]">{subcopy}</p>

        {!isSupabaseConfigured && (
          <p className="mb-4 flex gap-2 rounded-[6px] bg-[var(--amber-tint)] px-3 py-2 text-[12.5px] text-[var(--amber-deep)]">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>
              Accounts aren’t connected yet. Add Supabase URL and anon key to{" "}
              <code>.env.testing</code>.
            </span>
          </p>
        )}

        <Button variant="google" disabled={busy} onClick={onGoogle} fullWidth>
          <GoogleMark />
          {googleLabel}
        </Button>

        <div className="my-4 flex items-center gap-3 text-[12px] text-[var(--ink-faint)]">
          <span className="h-px flex-1 bg-[var(--line)]" />
          or
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
          </label>
          {showPassword && (
            <label className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Password</span>
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
          <Button type="submit" disabled={busy} fullWidth>
            {submitLabel}
          </Button>
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
      </div>
    </main>
  );
}
