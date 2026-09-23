import type { ComponentType, SVGProps } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  PrinterIcon,
  Square2StackIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { IconWell } from "../components/IconWell";

type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

const audience: { title: string; body: string; icon: OutlineIcon }[] = [
  {
    title: "Admins",
    body: "Run the organization: people, roles, and the shape of your program — without district-scale software.",
    icon: BuildingOfficeIcon,
  },
  {
    title: "Instructors",
    body: "Plan courses, copy what worked last term, and share or print materials. Built so volunteers don’t need a training session.",
    icon: BookOpenIcon,
  },
  {
    title: "Students",
    body: "See this week’s work and print what you need. The screen should make sense immediately — even if you don’t like technology. Parents who are linked to a student see the same view.",
    icon: UsersIcon,
  },
];

const jobs: { text: string; icon: OutlineIcon }[] = [
  { text: "Plan courses and group work into units", icon: CalendarDaysIcon },
  { text: "Copy a course so you aren’t starting from a blank page each term", icon: Square2StackIcon },
  { text: "Share materials with students — including print", icon: PrinterIcon },
  { text: "Run the org with clear admin, instructor, and student-facing roles", icon: UserGroupIcon },
];

export function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">About</p>
      <h1
        className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        For homeschool co-ops and micro-schools
      </h1>
      <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
        Course Wright gives you one place to plan courses, share materials with
        students, and run your program. It is meant to feel obvious — especially
        for anyone opening a link on a phone.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {audience.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
            >
              <IconWell>
                <Icon className="h-5 w-5" aria-hidden />
              </IconWell>
              <h2 className="mt-3 text-[15px] font-extrabold text-[var(--ink)]">{item.title}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
            </li>
          );
        })}
      </ul>

      <h2
        className="mt-12 text-[22px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        What you can do here
      </h2>
      <ul className="mt-4 flex flex-col gap-2">
        {jobs.map((job) => {
          const Icon = job.icon;
          return (
            <li
              key={job.text}
              className="flex items-start gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 text-[14.5px] text-[var(--ink)]"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]" aria-hidden />
              {job.text}
            </li>
          );
        })}
      </ul>

      <section className="mt-12 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <h2
          className="text-[22px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Not another heavy classroom tool
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Course work often lives in a mix of shared folders, group chats, and
          email — or in school software that feels like too much for a co-op.
          Course Wright is built around the jobs you actually need done, and
          does them simply.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/signup">Sign up</ButtonLink>
        <ButtonLink to="/pricing" variant="secondary">
          See pricing
          <ArrowRightIcon className="h-5 w-5" aria-hidden />
        </ButtonLink>
        <ButtonLink to="/" variant="secondary">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}
