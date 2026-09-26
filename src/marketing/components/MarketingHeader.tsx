import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useId, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthSession } from "@/auth/hooks/useAuthSession";
import { ButtonLink } from "@/ui/Button";
import { Wordmark } from "@/ui/Wordmark";

const secondaryLinks = [
  { to: "/about", label: "About" },
  { to: "/pricing", label: "Pricing" },
  { to: "/docs", label: "Help" },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "text-[13px] font-bold",
    isActive ? "text-[var(--green)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
  ].join(" ");
}

function MarketingAccountActions({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return <ButtonLink to="/my">My Account</ButtonLink>;
  }

  return (
    <>
      <NavLink to="/login" className={navClass}>
        Sign in
      </NavLink>
      <ButtonLink to="/signup">Sign up</ButtonLink>
    </>
  );
}

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();
  const { status, user } = useAuthSession();
  const signedIn = status === "ready" && user != null;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="border-b border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3.5">
        <Wordmark to="/" size="nav" shortOnMobile />
        <div className="flex items-center gap-x-3 sm:gap-x-5">
          <nav
            className="hidden items-center gap-x-5 md:flex"
            aria-label="Marketing"
          >
            {secondaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
            <MarketingAccountActions signedIn={signedIn} />
          </nav>

          <nav
            className="flex items-center gap-x-3 sm:gap-x-4 md:hidden"
            aria-label="Account"
          >
            <MarketingAccountActions signedIn={signedIn} />
            <button
              type="button"
              className="shrink-0 rounded-[6px] p-1.5 text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden />
              )}
            </button>
          </nav>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id={menuId}
          className="border-t border-[var(--line-soft)] md:hidden"
          aria-label="Marketing"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-5 py-3">
            {secondaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "rounded-[6px] px-2 py-2.5 text-[14px] font-bold",
                    isActive
                      ? "bg-[var(--green-tint)] text-[var(--green)]"
                      : "text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--ink)]",
                  ].join(" ")
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
