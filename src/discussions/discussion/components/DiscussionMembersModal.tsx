import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/ui/Button";
import { UserCard } from "@/organizations/user-card/UserCard";
import type { DiscussionMemberRecord } from "@/discussions/databridge/discussions";
import { useToastOnError } from "@/ui/useToastOnError";

export function DiscussionMembersModal({
  orgSlug,
  open,
  members,
  loading,
  error,
  onClose,
}: {
  orgSlug: string;
  open: boolean;
  members: DiscussionMemberRecord[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useToastOnError(open ? error : null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(32rem,80vh)] w-full max-w-md flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id={titleId}
          className="text-[15.5px] font-extrabold text-[var(--ink)]"
        >
          Members
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-soft)]">
          Everyone who can see this discussion.
        </p>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-[14px] text-[var(--ink-soft)]">Loading…</p>
          ) : null}
          {!loading && !error && members.length === 0 ? (
            <p className="text-[14px] text-[var(--ink-soft)]">
              No one else has access yet.
            </p>
          ) : null}
          {!loading && !error && members.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {members.map((member) => (
                <li key={member.userId}>
                  <UserCard
                    orgSlug={orgSlug}
                    userId={member.userId}
                    name={member.name}
                    role={member.role}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end">
          <Button ref={closeRef} type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
