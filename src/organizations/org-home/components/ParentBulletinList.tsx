import { Link } from "react-router-dom";
import type { ParentBulletinItem } from "@/parent/model/dashboard";
import { bulletinPath } from "@/bulletins/model/paths";
import { formatDateRange } from "@/courses/model/dates";

export function ParentBulletinList({
  orgSlug,
  items,
}: {
  orgSlug: string;
  items: ParentBulletinItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-[13px] font-bold text-[var(--green-deep)]">
        From your teachers
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => {
          const dates = formatDateRange(item.startDate, item.endDate);
          const countLabel =
            item.materialCount === 1
              ? "1 material"
              : `${item.materialCount} materials`;
          return (
            <li key={item.id}>
              <Link
                to={bulletinPath(orgSlug, item.courseId, item.id)}
                className="block rounded-[10px] border border-[var(--green)] bg-[var(--green-tint)] px-3.5 py-3"
              >
                <span className="block text-[15px] font-extrabold text-[var(--ink)]">
                  {item.title}
                </span>
                {item.body ? (
                  <span className="mt-1 block line-clamp-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                    {item.body}
                  </span>
                ) : null}
                <span className="mt-1.5 block text-[12.5px] text-[var(--ink-soft)]">
                  {item.courseTitle}
                  {dates ? ` · ${dates}` : ""}
                  {` · ${countLabel}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
