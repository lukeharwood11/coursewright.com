import { Link } from "react-router-dom";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { courseColorCssVar, type CourseColorKey } from "@/courses/model/courseColor";
import { eventPath } from "@/events/model/paths";
import { formatEventTime } from "@/events/model/schedule";

export function EventChip({
  orgSlug,
  eventId,
  title,
  location,
  startTime,
  endTime,
  colorKey,
  showDetails,
}: {
  orgSlug: string;
  eventId: number;
  title: string;
  location: string;
  startTime: string | null;
  endTime: string | null;
  colorKey: CourseColorKey | null;
  showDetails: boolean;
}) {
  const color = colorKey ? courseColorCssVar(colorKey) : "var(--green-deep)";
  const time = formatEventTime(startTime, endTime);
  return (
    <Link
      to={eventPath(orgSlug, eventId)}
      className={
        showDetails
          ? "flex items-start gap-2.5 rounded-[8px] px-3 py-2 text-[14px] font-bold leading-snug"
          : "block rounded-[6px] px-1.5 py-0.5 text-[11.5px] font-bold leading-snug"
      }
      style={{
        color,
        background: colorKey ? "transparent" : "var(--green-tint)",
        border: `1.5px solid ${color}`,
      }}
      title={[title, time, location].filter(Boolean).join(" · ")}
    >
      {showDetails ? (
        <CalendarDaysIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{title}</span>
        {showDetails && time ? <span className="block font-semibold">{time}</span> : null}
        {showDetails && location.trim() ? (
          <span className="block truncate font-semibold">{location}</span>
        ) : null}
      </span>
      {showDetails ? <span className="sr-only">Event</span> : null}
    </Link>
  );
}
