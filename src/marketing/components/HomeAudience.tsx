import { CheckIcon } from "@heroicons/react/24/outline";

const proof = [
  "Create a course and print before you’ve finished the roster",
  "Invite parents by email or link; they claim and see their student’s week",
  "Page quizzes for paper; course quizzes for in-app take-and-grade",
  "Gradebook, progress, and report cards when you’re ready to use them",
  "Installable on a phone (PWA) for teachers and parents on the go",
];

export function HomeAudience() {
  return (
    <section className="border-y border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <h2
          className="text-[22px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Who it’s for
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-5">
            <p className="text-[13px] font-bold text-[var(--green)]">For</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              Directors and teachers running a co-op or micro-school who need a real
              course — not just a membership list.
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-5">
            <p className="text-[13px] font-bold text-[var(--ink-faint)]">Not for</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              Districts, creator course stores, or teams that only need billing and
              SMS. Keep your ops tool if you have one; Course Wright owns the
              learning week.
            </p>
          </div>
        </div>

        <h3
          className="mt-10 text-[22px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          What you can do
        </h3>
        <ul className="mt-4 flex max-w-2xl flex-col gap-3">
          {proof.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
