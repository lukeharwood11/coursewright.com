import { AcademicCapIcon, HomeIcon } from "@heroicons/react/24/outline";
import { isOrgHomeDay, type HomeDay } from "@/organizations/model/homeDays";
import { isOrgSchoolDay, type SchoolDay } from "@/organizations/model/schoolDays";

export function OrgDayTypeIcons({
  date,
  schoolDays,
  homeDays,
  className = "inline-flex items-center gap-0.5 text-[var(--ink-faint)]",
  iconClassName = "h-3.5 w-3.5",
}: {
  date: string;
  schoolDays: readonly SchoolDay[];
  homeDays: readonly HomeDay[];
  className?: string;
  iconClassName?: string;
}) {
  const school = isOrgSchoolDay(date, schoolDays);
  const home = isOrgHomeDay(date, homeDays);
  if (!school && !home) return null;

  const labels = [
    school ? "School day" : null,
    home ? "Home day" : null,
  ].filter((label): label is string => label != null);

  return (
    <span className={className} title={labels.join(" · ")} aria-label={labels.join(", ")}>
      {school ? (
        <AcademicCapIcon className={iconClassName} aria-hidden />
      ) : null}
      {home ? <HomeIcon className={iconClassName} aria-hidden /> : null}
    </span>
  );
}

export function calendarDaySurfaceClass(
  isoDate: string,
  schoolDays: readonly SchoolDay[],
  homeDays: readonly HomeDay[],
): string {
  const school = isOrgSchoolDay(isoDate, schoolDays);
  const home = isOrgHomeDay(isoDate, homeDays);
  if (school && home) return "cw-calendar-school-day cw-calendar-home-day";
  if (school) return "cw-calendar-school-day";
  if (home) return "cw-calendar-home-day";
  return "bg-[var(--surface)]";
}
