import { Link } from "react-router-dom";
import { BellAlertIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { Badge } from "@/ui/Badge";
import {
  discussionAudienceLabel,
  discussionStatusLabel,
  discussionTargetName,
} from "@/discussions/model/audience";
import { discussionPath } from "@/discussions/model/paths";
import {
  discussionActivityLabel,
  discussionAuthorLabel,
} from "@/discussions/model/time";
import type { DiscussionRecord } from "@/discussions/databridge/discussions";

export type DiscussionListRow = DiscussionRecord & {
  unread: boolean;
  forLabel: string | null;
};

export function DiscussionList({
  orgSlug,
  items,
}: {
  orgSlug: string;
  items: DiscussionListRow[];
}) {
  return (
    <ul className="mt-4 flex max-w-2xl flex-col gap-1.5">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={discussionPath(orgSlug, item.id)}
            className={`flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 ${
              item.unread
                ? "border-[var(--green)] bg-[var(--green-tint)]"
                : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--green-tint)]"
            }`}
          >
            {item.unread ? (
              <BellAlertIcon
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]"
                aria-hidden
              />
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-extrabold text-[var(--ink)]">
                  {item.title}
                </span>
                {item.unread ? <span className="sr-only">Unread</span> : null}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={item.answeredAt ? "green" : "neutral"}>
                  {item.answeredAt ? (
                    <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />
                  ) : null}
                  {discussionStatusLabel(item.answeredAt)}
                </Badge>
                <Badge variant="slate">
                  {discussionAudienceLabel(item.audience)}
                </Badge>
                <span className="text-[13px] font-bold text-[var(--green-deep)]">
                  {discussionTargetName(item)}
                </span>
              </span>
              {item.forLabel ? (
                <span className="mt-0.5 block text-[13px] font-bold text-[var(--ink)]">
                  {item.forLabel}
                </span>
              ) : null}
              <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
                {[
                  discussionAuthorLabel(item.authorName),
                  discussionActivityLabel(item.lastMessageAt),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
