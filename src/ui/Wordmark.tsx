import { Link } from "react-router-dom";

type Size = "nav" | "login" | "hero";

const sizeClass: Record<Size, string> = {
  nav: "text-[19px]",
  login: "text-[17px]",
  hero: "text-[36px] leading-tight sm:text-[40px]",
};

const shortPx: Record<Size, number> = {
  nav: 28,
  login: 28,
  hero: 40,
};

const display = { fontFamily: "var(--font-display)" } as const;

/**
 * Concept A short mark — green rounded tile with paper CW.
 * Promoted from LogoConcepts; keep exploration marks on /logos.
 */
export function Mark({ px = 28, className = "" }: { px?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[24%] bg-[var(--green)] font-semibold text-[var(--paper)] ${className}`}
      style={{
        ...display,
        width: px,
        height: px,
        fontSize: px * 0.42,
        letterSpacing: "-0.02em",
      }}
      aria-hidden
    >
      CW
    </span>
  );
}

/** Concept A full lockup — unified green wordmark, amber underline under Wright. */
export function WordmarkText({ invert = false }: { invert?: boolean }) {
  const ink = invert ? "var(--paper)" : "var(--green)";
  return (
    <span className="inline-flex items-baseline whitespace-nowrap" style={{ color: ink }}>
      <span>Course</span>
      <span className="ml-[0.22em] border-b-[0.085em] border-[var(--amber)] pb-[0.06em]">
        Wright
      </span>
    </span>
  );
}

export function Wordmark({
  to,
  size = "nav",
  shortOnMobile = false,
  invert = false,
}: {
  to?: string;
  size?: Size;
  shortOnMobile?: boolean;
  invert?: boolean;
}) {
  const className = `${sizeClass[size]} inline-flex items-center font-semibold no-underline`;
  const label = shortOnMobile ? (
    <>
      <span className="sm:hidden">
        <Mark px={shortPx[size]} />
      </span>
      <span className="hidden sm:inline-flex">
        <WordmarkText invert={invert} />
      </span>
      <span className="sr-only">Course Wright</span>
    </>
  ) : (
    <WordmarkText invert={invert} />
  );

  if (to) {
    return (
      <Link to={to} className={className} style={display}>
        {label}
      </Link>
    );
  }

  return (
    <p className={className} style={display}>
      {label}
    </p>
  );
}
