import { useEffect, type ComponentType, type SVGProps } from "react";
import {
  BookOpenIcon,
  PrinterIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { IconWell } from "./IconWell";

type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

const props: { title: string; body: string; icon: OutlineIcon }[] = [
  {
    title: "Print the whole week in one tap",
    body: "Print a material, a unit, a quiz, or the full week without hunting through downloads and folders.",
    icon: PrinterIcon,
  },
  {
    title: "Keep every family on the same page",
    body: "Parents and students open the same clear week, with what is assigned, what is due, and what matters now.",
    icon: UsersIcon,
  },
  {
    title: "Everything for the course, together",
    body: "Keep plans, pages, files, quizzes, announcements, and the calendar beside the course they belong to.",
    icon: BookOpenIcon,
  },
  {
    title: "Built for small, flexible programs",
    body: "Start with one course and add people, classes, and school-wide tools as your family or organization grows.",
    icon: UserGroupIcon,
  },
];

export function HomeValueProps() {
  useEffect(() => {
    // The section is not in the static HTML, and the app resets window
    // scroll on first paint. A direct visit to /#this-week needs this.
    if (window.location.hash !== "#this-week") return;
    document.getElementById("this-week")?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <section id="this-week" className="scroll-mt-6 mx-auto max-w-5xl px-5 py-14">
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">Why Course Wright</p>
      <h2
        className="mt-1 text-[26px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        The school week, made simpler.
      </h2>
      <ul className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {props.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="flex items-start gap-4">
              <IconWell>
                <Icon className="h-5 w-5" aria-hidden />
              </IconWell>
              <div>
                <h3 className="text-[15.5px] font-extrabold text-[var(--ink)]">{item.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                  {item.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
