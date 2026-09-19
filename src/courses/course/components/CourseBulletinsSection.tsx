import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import type { BulletinListItem } from "@/bulletins/databridge/bulletins";
import {
  bulletinAvailability,
  bulletinAvailabilityLabel,
} from "@/bulletins/model/availability";
import { groupCourseBulletins } from "@/bulletins/model/grouping";
import { bulletinPath, newBulletinPath } from "@/bulletins/model/paths";
import { formatDateRange } from "@/courses/model/dates";
import { localIsoDate } from "@/parent/model/thisWeek";

function BulletinRow({
  orgSlug,
  bulletin,
  today,
  showStatus,
}: {
  orgSlug: string;
  bulletin: BulletinListItem;
  today: string;
  showStatus: boolean;
}) {
  const status = bulletinAvailability(today, bulletin.startDate, bulletin.endDate);
  const dates = formatDateRange(bulletin.startDate, bulletin.endDate);
  const countLabel =
    bulletin.materialCount === 1
      ? "1 material"
      : `${bulletin.materialCount} materials`;

  return (
    <li>
      <Link
        to={bulletinPath(orgSlug, bulletin.courseId, bulletin.id)}
        className="flex flex-col gap-1 px-4 py-3 hover:bg-[var(--green-tint)]"
      >
        <span className="text-[14.5px] font-semibold text-[var(--ink)]">
          {bulletin.title}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {showStatus ? (
            <Badge variant={status === "available" ? "green" : "neutral"}>
              {bulletinAvailabilityLabel(status)}
            </Badge>
          ) : null}
          {dates ? (
            <span className="text-[12.5px] text-[var(--ink-soft)]">{dates}</span>
          ) : null}
          <span className="text-[12.5px] text-[var(--ink-faint)]">{countLabel}</span>
        </span>
      </Link>
    </li>
  );
}

export function CourseBulletinsSection({
  orgSlug,
  courseId,
  bulletins,
  canEdit,
  isParent,
}: {
  orgSlug: string;
  courseId: number;
  bulletins: BulletinListItem[];
  canEdit: boolean;
  isParent: boolean;
}) {
  const today = localIsoDate();
  const visible = isParent
    ? bulletins.filter((row) =>
        bulletinAvailability(today, row.startDate, row.endDate) === "available",
      )
    : bulletins;
  const groups = groupCourseBulletins(visible, today);

  return (
    <section>
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Bulletins</h2>
      <p className="mt-0.5 text-[13px] text-[var(--ink-faint)]">
        Notes for families, with the materials that go with them.
      </p>

      {visible.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
          {canEdit
            ? "Add a bulletin when you want a week’s work in one place on the family home."
            : "No notes from this course right now."}
        </p>
      ) : isParent ? (
        <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {visible.map((bulletin) => (
            <BulletinRow
              key={bulletin.id}
              orgSlug={orgSlug}
              bulletin={bulletin}
              today={today}
              showStatus={false}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {(["available", "upcoming", "ended"] as const).map((key) =>
            groups[key].length === 0 ? null : (
              <div key={key}>
                <p className="text-[12px] font-bold text-[var(--ink-faint)]">
                  {key === "available"
                    ? "Available now"
                    : key === "upcoming"
                      ? "Upcoming"
                      : "Ended"}
                </p>
                <ul className="mt-1 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
                  {groups[key].map((bulletin) => (
                    <BulletinRow
                      key={bulletin.id}
                      orgSlug={orgSlug}
                      bulletin={bulletin}
                      today={today}
                      showStatus={false}
                    />
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}

      {canEdit ? (
        <div className="mt-3">
          <ButtonLink variant="ghost" fullWidth to={newBulletinPath(orgSlug, courseId)}>
            Add bulletin
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
