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
    title: "Print this week",
    body: "One tap for this week’s packet — or a single material, unit, or quiz. Paper is a first-class output, not a buried export.",
    icon: PrinterIcon,
  },
  {
    title: "Parents see what students see",
    body: "Linked parents land on the same This week home. No second portal to learn, no app training night before Monday.",
    icon: UsersIcon,
  },
  {
    title: "One course hub",
    body: "Units, pages, files, and quizzes in one org. Turn on announcements, discussions, calendar, or an org resource library when you need them — turn them off when you don’t.",
    icon: BookOpenIcon,
  },
  {
    title: "Built the way co-ops actually work",
    body: "Access follows course enrollment and parent–student links. Classes stay simple roster tools. Roles match volunteer orgs: owner, admin, instructor, parent, student.",
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
    <section id="this-week" className="scroll-mt-6 mx-auto max-w-5xl px-5 py-12">
      <h2
        className="text-[22px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        What it does
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {props.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
            >
              <IconWell>
                <Icon className="h-5 w-5" aria-hidden />
              </IconWell>
              <h3 className="mt-3 text-[15px] font-extrabold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
