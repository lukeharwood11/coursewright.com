export function HomePatchwork() {
  return (
    <section className="border-y border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <p className="text-[13px] font-bold text-[var(--ink-faint)]">
          How most co-ops run today
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-5">
            <h2
              className="text-[22px] font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              The patchwork
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              Drive for files. Chat for “what’s due.” A membership site for roster
              and dues. Someone still prints packets Sunday night.
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--green-tint)] p-5">
            <h2
              className="text-[22px] font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              With Course Wright
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              One place to build the course, enroll the family, and print this
              week. Parents open the same “This week” view students use — or take
              the paper packet and go.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
