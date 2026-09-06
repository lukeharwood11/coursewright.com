import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/auth/api/profiles";
import { signOut } from "@/auth/api/session";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { Button } from "@/ui/Button";
import { toastNotImplemented } from "@/ui/toast";

export function AccountSettingsPage() {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["profiles", user.id],
    queryFn: () => getProfile(user.id),
  });

  useEffect(() => {
    document.title = "Account · Course Wright";
  }, []);

  const name = profileQuery.data?.name ?? "";
  const email = profileQuery.data?.email ?? user.email ?? "";

  async function onSignOut() {
    setSigningOut(true);
    setError(null);
    const result = await signOut();
    if (result.error) {
      setError(result.error);
      setSigningOut(false);
      return;
    }
    navigate("/login", { replace: true });
  }

  return (
    <div className="max-w-lg px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Account
      </h1>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
        This is your Course Wright account — not a single organization.
      </p>

      <section className="mt-6 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Profile</h2>
        <dl className="mt-3 space-y-3 text-[14.5px]">
          <div>
            <dt className="text-[13px] font-bold text-[var(--ink-soft)]">Name</dt>
            <dd className="mt-1 text-[var(--ink)]">{name || "—"}</dd>
          </div>
          <div>
            <dt className="text-[13px] font-bold text-[var(--ink-soft)]">Email</dt>
            <dd className="mt-1 text-[var(--ink)]">{email || "—"}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => toastNotImplemented("Update profile")}
          >
            Update profile
          </Button>
        </div>
      </section>

      {error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <Button variant="secondary" onClick={onSignOut} disabled={signingOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
