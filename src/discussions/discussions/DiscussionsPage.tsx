import { useEffect } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { newDiscussionPath } from "@/discussions/model/paths";
import { DiscussionFilterChips } from "./components/DiscussionFilterChips";
import { DiscussionList } from "./components/DiscussionList";
import { useDiscussions } from "./hooks/useDiscussions";
import type { DiscussionFilter } from "@/discussions/model/audience";

export function DiscussionsPage() {
  const page = useDiscussions();
  useToastOnError(page.error);

  useEffect(() => {
    document.title = "Discussions · Course Wright";
  }, []);

  if (page.loading) {
    return (
      <PageLoading label="Loading discussions…" />
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Discussions
          </h1>
          {page.isParent ? (
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[var(--ink-soft)]">
              Talk with other families and teachers in a course or class.
            </p>
          ) : null}
        </div>
        {page.canCompose ? (
          <ButtonLink to={newDiscussionPath(page.organization.slug)}>
            <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
            New discussion
          </ButtonLink>
        ) : null}
      </div>

      <div className="mt-5">
        <DiscussionFilterChips
          value={page.filter}
          onChange={(value: DiscussionFilter) => page.setFilter(value)}
        />
      </div>

      {page.items.length === 0 ? (
        <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          {emptyCopy(page.isParent, page.canCompose)}
        </p>
      ) : (
        <DiscussionList orgSlug={page.organization.slug} items={page.items} />
      )}
    </div>
  );
}

function emptyCopy(isParent: boolean, canCompose: boolean): string {
  if (isParent && !canCompose) {
    return "Discussions are for a class your child is in, or a course they are enrolled in.";
  }
  if (canCompose) {
    return "No discussions yet. Start one when a course or class needs a place to talk.";
  }
  return "No discussions yet.";
}
