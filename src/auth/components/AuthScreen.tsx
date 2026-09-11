import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Wordmark } from "@/ui/Wordmark";
import { GoogleMark } from "./GoogleMark";
import { signInWithEmail } from "@/auth/api/signInWithEmail";
import { signInWithGoogle } from "@/auth/api/signInWithGoogle";
import { safeNextPath } from "@/auth/model/safeNext";
import { isSupabaseConfigured } from "@/infrastructure/supabase/client";

export function AuthScreen({
  heading,
  subcopy,
  submitLabel,
  googleLabel,
  footer,
}: {
  heading: string;
  subcopy: string;
  submitLabel: string;
  googleLabel: string;
  footer: ReactNode;
}) {
  const location = useLocation();
  const nextPath = safeNextPath(new URLSearchParams(location.search).get("next"));
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onGoogle() {
    setBusy(true);
    setMessage(null);
    const result = await signInWithGoogle(nextPath);
    if (result.error) setMessage(result.error);
    setBusy(false);
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await signInWithEmail(email.trim(), nextPath);
    if (result.error) setMessage(result.error);
    else setMessage("Check your email for a sign-in link.");
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
              <code>.env.development</code>.
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

        <form onSubmit={onEmail} className="flex flex-col gap-3">
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
          <Button type="submit" disabled={busy} fullWidth>
            {submitLabel}
          </Button>
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
