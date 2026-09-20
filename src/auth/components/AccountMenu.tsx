import { useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightStartOnRectangleIcon,
  ArrowsRightLeftIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "@/auth/api/session";
import { feedbackPath } from "@/feedback/model/paths";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

type AccountMenuProps = {
  name: string;
  email: string;
  roleLabel?: string;
  roleBadgeVariant?: "green" | "slate" | "neutral";
  orgName?: string;
  orgSlug?: string;
  showOrgSettings?: boolean;
};

export function AccountMenu({
  name,
  email,
  roleLabel,
  roleBadgeVariant = "neutral",
  orgName,
  orgSlug,
  showOrgSettings = true,
}: AccountMenuProps) {
  const navigate = useNavigate();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const avatarName = name || email || "You";
  const displayName = name || "Account";
  const showOrganization = Boolean(orgName && orgSlug && roleLabel);

  async function onSignOut() {
    setSigningOut(true);
    const result = await signOut();
    if (result.error) {
      setSigningOut(false);
      setOpen(false);
      return;
    }
    navigate("/login", { replace: true });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={avatarName} size={28} />
      </button>

      <AnchoredPopup
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        id={menuId}
        label="Account"
        className="w-[16.5rem]"
      >
        <section aria-label="User">
          <div className="px-3.5 pb-2 pt-3">
            <p className="text-[11px] font-bold text-[var(--ink-faint)]">User</p>
            <div className="mt-2 flex items-start gap-3">
              <Avatar name={avatarName} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-extrabold text-[var(--ink)]">
                  {displayName}
                </p>
                {email ? (
                  <p className="mt-0.5 truncate text-[12px] text-[var(--ink-soft)]">
                    {email}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div
            className={`py-1${showOrganization ? " border-b border-[var(--line-soft)]" : ""}`}
          >
            <Link
              role="menuitem"
              to="/my/settings"
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              <Cog6ToothIcon className="h-4 w-4 shrink-0" aria-hidden />
              Settings
            </Link>
            <Link
              role="menuitem"
              to={feedbackPath(orgSlug)}
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4 shrink-0" aria-hidden />
              Send feedback
            </Link>
            <button
              type="button"
              role="menuitem"
              className={`${itemClassName} disabled:opacity-60`}
              disabled={signingOut}
              onClick={onSignOut}
            >
              <ArrowRightStartOnRectangleIcon
                className="h-4 w-4 shrink-0"
                aria-hidden
              />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </section>

        {showOrganization ? (
          <section aria-label="Organization">
            <div className="px-3.5 pb-2 pt-3">
              <p className="text-[11px] font-bold text-[var(--ink-faint)]">
                Organization
              </p>
              <div className="mt-2 flex items-start gap-3">
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-[var(--green-tint)] text-[var(--green-deep)]"
                  aria-hidden
                >
                  <BuildingOffice2Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-extrabold text-[var(--ink)]">
                    {orgName}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-[var(--ink-soft)]">
                    /my/{orgSlug}
                  </p>
                  <div className="mt-2">
                    <Badge variant={roleBadgeVariant}>{roleLabel}</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-1">
              {showOrgSettings ? (
                <Link
                  role="menuitem"
                  to={`/my/${orgSlug}/settings`}
                  className={itemClassName}
                  onClick={() => setOpen(false)}
                >
                  <Cog6ToothIcon className="h-4 w-4 shrink-0" aria-hidden />
                  Org settings
                </Link>
              ) : null}
              <Link
                role="menuitem"
                to="/my"
                className={itemClassName}
                onClick={() => setOpen(false)}
              >
                <ArrowsRightLeftIcon
                  className="h-4 w-4 shrink-0"
                  aria-hidden
                />
                Switch
              </Link>
            </div>
          </section>
        ) : null}
      </AnchoredPopup>
    </>
  );
}
