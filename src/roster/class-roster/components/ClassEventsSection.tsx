import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import type { EventSummary } from "@/events/databridge/events";
import { eventPath, newEventPath } from "@/events/model/paths";
import { formatEventWhen } from "@/events/model/schedule";

export function ClassEventsSection({
  orgSlug,
  classId,
  events,
  canEdit,
}: {
  orgSlug: string;
  classId: number;
  events: EventSummary[];
  canEdit: boolean;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Events</h2>
        {canEdit ? (
          <ButtonLink
            variant="secondary"
            to={newEventPath(orgSlug, { audience: "class", classId })}
          >
            <PlusIcon className="h-5 w-5" aria-hidden />
            Add event
          </ButtonLink>
        ) : null}
      </div>
      {events.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">No events for this class yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                to={eventPath(orgSlug, event.id)}
                className="flex flex-col gap-0.5 px-4 py-3 hover:bg-[var(--green-tint)]"
              >
                <span className="text-[14.5px] font-semibold text-[var(--ink)]">{event.title}</span>
                <span className="text-[12.5px] text-[var(--ink-soft)]">
                  {formatEventWhen(event)} · {event.location}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
