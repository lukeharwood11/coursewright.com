const steps = [
  {
    title: "Build the course",
    body: "Bring lessons, pages, files, and quizzes together. Start printing before the roster is even finished.",
  },
  {
    title: "Use or share the week",
    body: "Work from one clear view yourself, or enroll students and invite parents so everyone sees what is assigned, due, and important.",
  },
  {
    title: "Teach, reuse, and grow",
    body: "Copy what worked into the next course, track progress, and add organization tools when you need them.",
  },
];

export function HomeAudience() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-6 border-y border-[var(--line-soft)] bg-[var(--surface)]"
    >
      <div className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-[13px] font-bold text-[var(--ink-faint)]">How it works</p>
        <h2
          className="mt-1 max-w-2xl text-[26px] font-semibold leading-snug text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          From course plan to a clear week in three steps.
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
          Course Wright is sized for families managing their own learning and for
          directors, teachers, and volunteers running co-ops and small schools.
          No one should need another complicated system to learn.
        </p>

        <ol className="mt-9 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t border-[var(--line)] pt-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--green-tint)] text-[13px] font-extrabold text-[var(--green-deep)]">
                {index + 1}
              </span>
              <h3 className="mt-4 text-[16px] font-extrabold text-[var(--ink)]">
                {step.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
