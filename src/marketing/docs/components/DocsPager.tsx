import { Link } from "react-router-dom";
import type { HelpDocTopic } from "../../model/helpDocs";
import { helpDocPath, helpDocTopics } from "../../model/helpDocs";

type DocsPagerProps = {
  topic: HelpDocTopic;
};

export function DocsPager({ topic }: DocsPagerProps) {
  const index = helpDocTopics.findIndex((item) => item.slug === topic.slug);
  const prev = index > 0 ? helpDocTopics[index - 1] : undefined;
  const next = index >= 0 && index < helpDocTopics.length - 1 ? helpDocTopics[index + 1] : undefined;

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Adjacent help topics"
      className="mt-12 flex flex-wrap items-stretch justify-between gap-3 border-t border-[var(--line-soft)] pt-6"
    >
      {prev ? (
        <Link
          to={helpDocPath(prev.slug)}
          className="min-w-[10rem] flex-1 rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--line)]"
        >
          <p className="text-[12px] font-bold text-[var(--ink-faint)]">Previous</p>
          <p className="mt-0.5 text-[14px] font-bold text-[var(--ink)]">{prev.navLabel}</p>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
      {next ? (
        <Link
          to={helpDocPath(next.slug)}
          className="min-w-[10rem] flex-1 rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 text-right hover:border-[var(--line)]"
        >
          <p className="text-[12px] font-bold text-[var(--ink-faint)]">Next</p>
          <p className="mt-0.5 text-[14px] font-bold text-[var(--ink)]">{next.navLabel}</p>
        </Link>
      ) : null}
    </nav>
  );
}
