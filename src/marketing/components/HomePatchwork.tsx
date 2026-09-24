export function HomePatchwork() {
  return (
    <section className="border-y border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-[13px] font-bold text-[var(--ink-faint)]">The problem</p>
        <h2
          className="mt-1 max-w-2xl text-[26px] font-semibold leading-snug text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          One school week, scattered everywhere.
        </h2>
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-5 sm:p-6">
            <h3
              className="text-[22px] font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              The patchwork
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              Files in one folder. Due dates in chat. Rosters and dues somewhere
              else. By Sunday night, someone is still assembling packets by hand.
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--green-tint)] p-5 sm:p-6">
            <h3
              className="text-[22px] font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              With Course Wright
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              Plan the course, share the week, and print the packet from one place.
              Students and parents see the same clear plan for what comes next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
