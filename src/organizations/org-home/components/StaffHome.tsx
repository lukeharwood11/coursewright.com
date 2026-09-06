import {
  BookOpenIcon,
  Cog6ToothIcon,
  PlusIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { toastNotImplemented } from "@/ui/toast";
import { Link } from "react-router-dom";

export function StaffHome({
  orgName,
  orgSlug,
}: {
  orgName: string;
  orgSlug: string;
}) {
  const base = `/my/${orgSlug}`;
  const destinations = [
    {
      title: "Courses",
      description: "Offerings families participate in.",
      to: `${base}/courses`,
      icon: BookOpenIcon,
    },
    {
      title: "Roster",
      description: "Student profiles for this organization.",
      to: `${base}/roster`,
      icon: UsersIcon,
    },
    {
      title: "Families",
      description: "Parent directory for this organization.",
      to: `${base}/families`,
      icon: UserGroupIcon,
    },
    {
      title: "Organization settings",
      description: "Permalink, grade scheme, and staff.",
      to: `${base}/settings`,
      icon: Cog6ToothIcon,
    },
  ] as const;

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {orgName}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            Plan courses, share materials, and print from one place. Use the
            sidebar to jump to a course or family.
          </p>
        </div>
        <Button onClick={() => toastNotImplemented("Create course")}>
          <PlusIcon className="h-5 w-5" aria-hidden />
          Create course
        </Button>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {destinations.map((item) => (
          <li key={item.title}>
            <Link
              to={item.to}
              className="flex h-full w-full items-start gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-4 text-left hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            >
              <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-[var(--green)]" aria-hidden />
              <span>
                <span className="block text-[15.5px] font-extrabold text-[var(--ink)]">
                  {item.title}
                </span>
                <span className="mt-1 block text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                  {item.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
        You can create a course and print materials without a roster.
      </p>
    </div>
  );
}
