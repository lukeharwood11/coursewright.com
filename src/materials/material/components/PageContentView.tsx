import type { BlockRecord } from "@/materials/databridge/blocks";
import { pageHasContent } from "@/materials/model/pageContent";
import { PageContentEditor } from "./PageContentEditor";

export function PageContentView({
  blocks,
  viewKey,
  showAnswers = false,
}: {
  blocks: BlockRecord[];
  viewKey: string;
  showAnswers?: boolean;
}) {
  if (!pageHasContent(blocks)) {
    return (
      <p className="text-[14.5px] text-[var(--ink-soft)]">
        This page doesn’t have any content yet.
      </p>
    );
  }

  return (
    <PageContentEditor
      blocks={blocks}
      editorKey={viewKey}
      editable={false}
      showAnswers={showAnswers}
    />
  );
}
