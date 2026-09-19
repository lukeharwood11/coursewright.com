import type { ComponentType, SVGProps } from "react";
import {
  BuildingOffice2Icon,
  FolderIcon,
  PrinterIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { IconWell } from "./IconWell";

type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

const props: { title: string; body: string; icon: OutlineIcon }[] = [
  {
    title: "Ease of use",
    body: "If something isn’t intuitive, tell us — we’ll fix it.",
    icon: SparklesIcon,
  },
  {
    title: "Built for small organizations",
    body: "Made for co-ops and micro-schools — and shaped with the people who run them.",
    icon: BuildingOffice2Icon,
  },
  {
    title: "One place for materials",
    body: "Materials, files, quizzes, and communication — all in one application.",
    icon: FolderIcon,
  },
  {
    title: "Paper when you need it",
    body: "Print a material, a unit, or this week in one tap. Sharing isn’t an afterthought.",
    icon: PrinterIcon,
  },
];

export function HomeValueProps() {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-12">
      <h2
        className="text-[22px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Why Course Wright?
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
