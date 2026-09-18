import type { BlockRecord } from "@/materials/databridge/blocks";
import { pageHasContent } from "@/materials/model/pageContent";
import { PageContentEditor } from "./PageContentEditor";

export function PageContentView({
  blocks,
  viewKey,
}: {
  blocks: BlockRecord[];
  viewKey: string;
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
    />
  );
}
