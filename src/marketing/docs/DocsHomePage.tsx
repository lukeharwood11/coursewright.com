import { DocsArticleBody } from "./components/DocsArticleBody";
import { DocsPager } from "./components/DocsPager";
import { helpDocBySlug } from "../model/helpDocs";

export function DocsHomePage() {
  const topic = helpDocBySlug("");

  if (!topic) {
    return null;
  }

  return (
    <article>
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">Help</p>
      <h1
        className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {topic.title}
      </h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
        {topic.description}
      </p>
      <div className="mt-8">
        <DocsArticleBody blocks={topic.body} />
      </div>
      <DocsPager topic={topic} />
    </article>
  );
}
