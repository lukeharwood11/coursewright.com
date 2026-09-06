import type { ComponentType } from "react";
import {
  ConceptAFull,
  ConceptAShort,
  ConceptBFull,
  ConceptBShort,
  ConceptCFull,
  ConceptCShort,
} from "@/ui";

type Concept = {
  id: string;
  name: string;
  idea: string;
  Full: ComponentType<{ invert?: boolean }>;
  Short: ComponentType<{ px?: number }>;
};

const concepts: Concept[] = [
  {
    id: "A",
    name: "Keystone · live",
    idea: "Unified green wordmark, amber underline under “Wright.” The short mark is a green app-tile with paper CW — the strongest favicon. Promoted to the product Wordmark.",
    Full: ConceptAFull,
    Short: ConceptAShort,
  },
  {
    id: "B",
    name: "Done wright",
    idea: "Two-tone wordmark (ink + green) closed by an amber check — leans into “course right / done wright.” Short mark is a green disc with a check.",
    Full: ConceptBFull,
    Short: ConceptBShort,
  },
  {
    id: "C",
    name: "Playwright’s seal",
    idea: "Editorial two-tone on a baseline rule with a pen-nib accent — the craftsperson / playwright angle. Short mark is an outlined seal.",
    Full: ConceptCFull,
    Short: ConceptCShort,
  },
];

function ConceptColumn({ concept }: { concept: Concept }) {
  const { id, name, idea, Full, Short } = concept;
  return (
    <div className="flex flex-col gap-5 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-6">
      <div>
        <p className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--ink-faint)]">
          Concept {id}
        </p>
        <h2
          className="mt-1 text-[22px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {name}
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{idea}</p>
      </div>

      {/* Full lockup on paper */}
      <div className="flex min-h-[96px] items-center rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] px-5 py-6">
        <Full />
      </div>

      {/* Full lockup on green (inverted) */}
      <div className="flex min-h-[96px] items-center rounded-[10px] bg-[var(--green)] px-5 py-6">
        <Full invert />
      </div>

      {/* Short CW mark at scale */}
      <div className="flex items-end gap-4 rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] px-5 py-6">
        <Short px={56} />
        <Short px={40} />
        <Short px={28} />
        <Short px={18} />
      </div>

      {/* Short mark in a mock nav bar */}
      <div className="flex items-center gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3">
        <Short px={30} />
        <span className="text-[14px] font-bold text-[var(--ink)]">Riverside Co-op</span>
        <span className="ml-auto h-7 w-7 rounded-full bg-[var(--slate)]" aria-hidden />
      </div>
    </div>
  );
}

export function LogosPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <header className="mb-8 max-w-2xl">
        <h1
          className="text-[28px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Logo concepts
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
          Three directions for the Course Wright mark and its short “CW” form, shown on paper,
          on green, and at nav/favicon scale. Concept A (Keystone) is the live product mark;
          B and C stay here for comparison.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {concepts.map((c) => (
          <ConceptColumn key={c.id} concept={c} />
        ))}
      </div>
    </main>
  );
}
