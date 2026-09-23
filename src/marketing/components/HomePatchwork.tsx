import type { ComponentType, SVGProps } from "react";
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  PrinterIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

const today: { name: string; use: string; icon: OutlineIcon }[] = [
  { name: "File sharing", use: "Lesson files", icon: FolderIcon },
  { name: "Communication", use: "Day-to-day questions", icon: ChatBubbleLeftRightIcon },
  { name: "Content building", use: "Courses and materials", icon: DocumentTextIcon },
];

const withCourseWright: { name: string; use: string; icon: OutlineIcon }[] = [
  { name: "One course hub", use: "Materials, files, and quizzes", icon: HomeIcon },
  { name: "Families stay in the loop", use: "Updates in the same place", icon: UsersIcon },
  { name: "Print when you need paper", use: "A material, a unit, or this week", icon: PrinterIcon },
];

export function HomePatchwork() {
  return (
    <>
      <section className="border-y border-[var(--line-soft)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[13px] font-bold text-[var(--ink-faint)]">Today</p>
            <h2
              className="mt-1 text-[22px] font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Materials shouldn’t live in three places
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              Many organizations split up file sharing, communication, and content
              building all in different places. Course Wright puts everything
              together in one hub that’s easy to open — especially on a phone.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {today.map((tool) => {
              const Icon = tool.icon;
              return (
                <li
                  key={tool.name}
                  className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] px-4 py-3"
                >
                  <span className="inline-flex items-center gap-2.5 text-[14px] font-extrabold text-[var(--ink)]">
                    <Icon className="h-5 w-5 text-[var(--ink-faint)]" aria-hidden />
                    {tool.name}
                  </span>
                  <span className="text-right text-[13px] text-[var(--ink-soft)]">{tool.use}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="border-b border-[var(--line-soft)] bg-[var(--paper)]">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[13px] font-bold text-[var(--green)]">With Course Wright</p>
            <h2
              className="mt-1 text-[22px] font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              One hub for the whole course
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              Plan materials, share files, run quizzes, and keep students updated
              from the same place — so nobody has to remember which app holds
              which piece.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {withCourseWright.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3"
                >
                  <span className="inline-flex items-center gap-2.5 text-[14px] font-extrabold text-[var(--ink)]">
                    <Icon className="h-5 w-5 text-[var(--green)]" aria-hidden />
                    {item.name}
                  </span>
                  <span className="text-right text-[13px] text-[var(--ink-soft)]">{item.use}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
