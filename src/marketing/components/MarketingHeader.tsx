import { NavLink } from "react-router-dom";
import { ButtonLink } from "@/ui/Button";
import { Wordmark } from "@/ui/Wordmark";

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "text-[13px] font-bold",
    isActive ? "text-[var(--green)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
  ].join(" ");
}

export function MarketingHeader() {
  return (
    <header className="border-b border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <Wordmark to="/" size="nav" shortOnMobile />
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Marketing">
          <NavLink to="/about" className={navClass}>
            About
          </NavLink>
          <NavLink to="/pricing" className={navClass}>
            Pricing
          </NavLink>
          <NavLink to="/docs" className={navClass}>
            Help
          </NavLink>
          <NavLink to="/login" className={navClass}>
            Sign in
          </NavLink>
          <ButtonLink to="/signup">Sign up</ButtonLink>
        </nav>
      </div>
    </header>
  );
}
