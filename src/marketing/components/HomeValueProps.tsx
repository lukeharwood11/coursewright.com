import type { ComponentType, SVGProps } from "react";
import { EyeIcon, FolderIcon, PrinterIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { IconWell } from "./IconWell";

type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

const props: { title: string; body: string; icon: OutlineIcon }[] = [
  {
    title: "One place for materials",
    body: "Lesson plans, files, and this week’s work live together — so families aren’t hunting through folders, chats, and inboxes.",
    icon: FolderIcon,
  },
  {
    title: "Share wright, including paper",
    body: "Print a material, a unit, or this week in one tap. If someone just wants it on paper, that’s easy.",
    icon: PrinterIcon,
  },
  {
    title: "Obvious the second you open it",
    body: "Built so parents can see what’s going on immediately, and so volunteers can spend their time teaching — not managing software.",
    icon: EyeIcon,
  },
  {
    title: "Built for co-ops, not districts",
    body: "Clear roles for admins, instructors, and parents — without the extra machinery of a big-school platform.",
    icon: UserGroupIcon,
  },
];

export function HomeValueProps() {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-12">
      <h2
        className="text-[22px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        What Course Wright is for
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
