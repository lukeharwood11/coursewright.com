/** Temporary placeholder screen while domains are stubbed. */
export function StubPage({
  title,
  domain,
}: {
  title: string;
  domain: string;
}) {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-3 px-6 py-16">
      <p
        className="text-sm font-bold tracking-normal"
        style={{ color: "var(--ink-faint)" }}
      >
        Course Wright · stub
      </p>
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
      >
        {title}
      </h1>
      <p className="text-[14.5px]" style={{ color: "var(--ink-soft)" }}>
        Placeholder for the <code>{domain}</code> domain. See{" "}
        <code>src/{domain}/AGENTS.md</code> and{" "}
        <code>docs/HUMAN_NEEDED.md</code> for next steps.
      </p>
    </main>
  );
}
