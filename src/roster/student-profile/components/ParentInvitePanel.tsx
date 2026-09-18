import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export function ParentInvitePanel({
  parentEmail,
  canInvite,
  loading,
  loadError,
  pendingEmail,
  linked,
  inviting,
  canceling,
  copied,
  inviteUrl,
  onInvite,
  onCopy,
  onCancel,
}: {
  parentEmail: string | null;
  canInvite: boolean;
  loading: boolean;
  loadError: string | null;
  pendingEmail: string | null;
  linked: boolean;
  inviting: boolean;
  canceling: boolean;
  copied: boolean;
  inviteUrl: string | null;
  onInvite: (email: string) => void;
  onCopy: () => void;
  onCancel: () => void;
}) {
  if (!canInvite) return null;

  return (
    <section className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Parent invite</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        Copy a link for this parent. They sign in with the same email. Joining
        the organization does not open course materials until this student is
        enrolled in an active published course.
      </p>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading invite…</p>
      ) : null}

      {loadError ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {loadError}
        </p>
      ) : null}

      {!loading && linked ? (
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--ink)]">
          This parent has accepted. Materials show up after enrollment.
        </p>
      ) : null}

      {!loading && !linked && !parentEmail && !pendingEmail ? (
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--ink-soft)]">
          Add a parent email above and save, then you can copy an invite link.
        </p>
      ) : null}

      {!loading && !linked && pendingEmail && inviteUrl ? (
        <div className="mt-4">
          <p className="text-[13.5px] text-[var(--ink-soft)]">
            Waiting on <span className="font-bold text-[var(--ink)]">{pendingEmail}</span>
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              className="min-w-0 flex-1"
              readOnly
              value={inviteUrl}
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button variant="secondary" onClick={onCopy}>
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button variant="secondary" disabled={canceling} onClick={onCancel}>
              {canceling ? "Canceling…" : "Cancel"}
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && !linked && parentEmail && !pendingEmail ? (
        <div className="mt-4">
          <Button onClick={() => onInvite(parentEmail)} disabled={inviting}>
            {inviting ? "Creating…" : "Create parent invite"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
