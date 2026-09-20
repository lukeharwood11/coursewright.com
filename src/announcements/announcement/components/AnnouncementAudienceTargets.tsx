import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { announcementTargetSummary } from "@/announcements/model/audience";

export function AnnouncementAudienceTargets({ names }: { names: string[] }) {
  const summary = announcementTargetSummary(names, "Audience");
  if (names.length <= 1) {
    return <Badge variant="neutral">{summary}</Badge>;
  }

  return (
    <details className="relative inline-block">
      <summary className="inline-flex cursor-pointer list-none items-center gap-0.5 rounded-full bg-[var(--line-soft)] px-2 py-0.5 text-[12px] font-bold text-[var(--ink-soft)] [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        <ChevronDownIcon className="h-3 w-3" aria-hidden />
      </summary>
      <ul className="absolute z-10 mt-1 min-w-[12rem] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(20,24,20,0.08)]">
        {names.map((name, index) => (
          <li
            key={`${name}-${index}`}
            className="px-3 py-1.5 text-[13px] font-semibold text-[var(--ink)]"
          >
            {name}
          </li>
        ))}
      </ul>
    </details>
  );
}
