import type { HelpDocBlock } from "../../model/helpDocs";

type DocsArticleBodyProps = {
  blocks: HelpDocBlock[];
};

export function DocsArticleBody({ blocks }: DocsArticleBodyProps) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "p":
            return (
              <p key={key} className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
                {block.text}
              </p>
            );
          case "h2":
            return (
              <h2
                key={key}
                className="mt-3 text-[22px] font-semibold text-[var(--ink)] first:mt-0"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {block.text}
              </h2>
            );
          case "ul":
            return (
              <ul key={key} className="flex list-disc flex-col gap-2 pl-5 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="flex list-decimal flex-col gap-2 pl-5 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <p
                key={key}
                className="rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--green-tint)] px-4 py-3 text-[14px] leading-relaxed text-[var(--green-deep)]"
              >
                {block.text}
              </p>
            );
          default: {
            const _exhaustive: never = block;
            return _exhaustive;
          }
        }
      })}
    </div>
  );
}
