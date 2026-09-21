import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button, ButtonLink } from "@/ui/Button";
import { userProfilePath } from "@/organizations/model/paths";
import {
  UserProfileContent,
  UserProfileNotFound,
} from "./components/UserProfileContent";
import { useUserProfile } from "./hooks/useUserProfile";

export function UserProfileModal({
  userId,
  open,
  onClose,
}: {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const page = useUserProfile(open ? userId : null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !userId) return null;

  const profileHref = userProfilePath(page.organization.slug, userId);

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
        className="relative flex max-h-[min(36rem,85vh)] w-full max-w-lg flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {page.loading ? (
            <p className="text-[14px] text-[var(--ink-soft)]">Loading profile…</p>
          ) : null}
          {!page.loading && (page.notFound || !page.profile) ? (
            <>
              <h2
                id={titleId}
                className="text-[20px] font-semibold text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Profile
              </h2>
              <div className="mt-2">
                <UserProfileNotFound
                  orgSlug={page.organization.slug}
                  orgName={page.organization.name}
                  error={page.error}
                  showBackLink={false}
                />
              </div>
            </>
          ) : null}
          {!page.loading && page.profile ? (
            <UserProfileContent
              profile={page.profile}
              orgSlug={page.organization.slug}
              role={page.role}
              compact
              headingId={titleId}
            />
          ) : null}
          {page.loading ? (
            <h2 id={titleId} className="sr-only">
              Profile
            </h2>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button ref={closeRef} type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {page.profile ? (
            <ButtonLink variant="primary" to={profileHref}>
              View profile
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
