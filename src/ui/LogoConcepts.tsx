/**
 * Logo exploration — three concepts, each with a full wordmark and a short "CW" mark.
 *
 * Concept A (Keystone) is the live mark in Wordmark.tsx / Mark. Keep B and C here for
 * comparison on /logos. Style tokens: docs/STYLE_GUIDE.md.
 *
 * All three stay type-first (Lora) and lean on Wright Green with amber as a sparing
 * accent — no carpenter's square / ruler, per branding.
 */

const display = { fontFamily: "var(--font-display)" } as const;

/* Small check glyph — "done wright / course right". */
function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 13.2 9.3 18.5 20 6"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Whole fountain pen, laid horizontally — nib to the right, amber tip. */
function PenHorizontal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 154 22" fill="none" className={className} aria-hidden>
      {/* cap (slightly taller than the barrel) */}
      <rect x="3" y="4" width="50" height="14" rx="7" fill="currentColor" />
      {/* clip, flush along the top of the cap with a rounded end */}
      <rect x="9" y="2.6" width="30" height="3" rx="1.5" fill="currentColor" />
      <circle cx="39" cy="4.1" r="2" fill="currentColor" />
      {/* barrel — overlaps the cap so it reads as one pen */}
      <rect x="47" y="6" width="66" height="10" rx="5" fill="currentColor" />
      {/* cap band — thin amber ring at the cap/barrel joint */}
      <rect x="49" y="5.5" width="3.5" height="11" rx="1.2" fill="var(--amber)" />
      {/* grip section, tapering toward the nib */}
      <path d="M111 6.6 L126 8.9 L126 13.1 L111 15.4 Z" fill="currentColor" />
      {/* nib */}
      <path d="M125 8.4 L150 11 L125 13.6 Z" fill="var(--amber)" />
      {/* nib slit */}
      <path d="M131 11 L148 11" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
      {/* breather hole */}
      <circle cx="132" cy="11" r="1.2" fill="currentColor" />
    </svg>
  );
}

/* Pen nib — "playwright / one who writes courses". */
function Nib({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2 20 15 12 22 4 15Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path d="M12 10 12 22" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.4" fill="currentColor" />
    </svg>
  );
}

/* =========================================================================
 * Concept A — "Keystone": unified green wordmark, amber underline under Wright.
 * Short mark = green rounded tile with paper CW. App-icon friendly.
 * ========================================================================= */

export function ConceptAFull({ invert = false }: { invert?: boolean }) {
  const ink = invert ? "var(--paper)" : "var(--green)";
  return (
    <span
      className="inline-flex items-baseline whitespace-nowrap text-[36px] font-semibold leading-none"
      style={{ ...display, color: ink }}
    >
      <span>Course</span>
      <span className="ml-[0.22em] border-b-[3px] border-[var(--amber)] pb-[0.06em]">
        Wright
      </span>
    </span>
  );
}

export function ConceptAShort({ px = 48 }: { px?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[24%] bg-[var(--green)] font-semibold text-[var(--paper)]"
      style={{ ...display, width: px, height: px, fontSize: px * 0.42, letterSpacing: "-0.02em" }}
    >
      CW
    </span>
  );
}

/* =========================================================================
 * Concept B — "Done wright": two-tone wordmark with an amber check accent.
 * Short mark = green disc, paper CW, small amber check.
 * ========================================================================= */

export function ConceptBFull({ invert = false }: { invert?: boolean }) {
  const course = invert ? "var(--paper)" : "var(--ink)";
  const wright = invert ? "var(--paper)" : "var(--green)";
  return (
    <span
      className="inline-flex items-center whitespace-nowrap text-[36px] font-semibold leading-none"
      style={display}
    >
      <span style={{ color: course }}>Course</span>
      <span className="ml-[0.22em]" style={{ color: wright }}>
        Wright
      </span>
      <Check className="ml-[0.18em] h-[0.5em] w-[0.5em] text-[var(--amber)]" />
    </span>
  );
}

export function ConceptBShort({ px = 48 }: { px?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full bg-[var(--green)] font-semibold text-[var(--paper)]"
      style={{ ...display, width: px, height: px, fontSize: px * 0.4, letterSpacing: "-0.02em" }}
    >
      CW
      <Check className="absolute right-[8%] top-[8%] h-[26%] w-[26%] text-[var(--amber)]" />
    </span>
  );
}

/* =========================================================================
 * Concept C — "Playwright's seal": editorial two-tone on a baseline rule,
 * with a pen-nib accent. Short mark = outlined seal with serif CW + nib.
 * ========================================================================= */

export function ConceptCFull({ invert = false }: { invert?: boolean }) {
  const course = invert ? "var(--paper)" : "var(--ink-soft)";
  const wright = invert ? "var(--paper)" : "var(--green)";
  return (
    <span
      className="inline-flex items-baseline whitespace-nowrap text-[36px] font-semibold leading-none"
      style={display}
    >
      <span style={{ color: course }}>Course</span>
      {/* "Wright" over a whole fountain pen laid horizontally beneath it */}
      <span className="ml-[0.2em] inline-flex flex-col items-stretch">
        <span style={{ color: wright }}>Wright</span>
        <span style={{ color: wright }}>
          <PenHorizontal className="mt-[0.12em] w-full" />
        </span>
      </span>
    </span>
  );
}

export function ConceptCShort({ px = 48 }: { px?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full border-2 border-[var(--green)] font-semibold text-[var(--green)]"
      style={{ ...display, width: px, height: px, fontSize: px * 0.36, letterSpacing: "-0.01em" }}
    >
      CW
      <Nib
        className="absolute bottom-[8%] left-1/2 h-[24%] w-[24%] -translate-x-1/2 text-[var(--amber)]"
      />
    </span>
  );
}
