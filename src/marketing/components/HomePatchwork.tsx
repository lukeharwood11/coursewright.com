import type { ComponentType, SVGProps } from "react";
import { ChatBubbleLeftRightIcon, EnvelopeIcon, FolderIcon } from "@heroicons/react/24/outline";

type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

const today: { name: string; use: string; icon: OutlineIcon }[] = [
  { name: "Microsoft folders", use: "Files for lesson materials", icon: FolderIcon },
  { name: "WhatsApp", use: "Day-to-day chatter", icon: ChatBubbleLeftRightIcon },
  { name: "Outlook", use: "Parent email", icon: EnvelopeIcon },
];

export function HomePatchwork() {
  return (
    <section className="border-y border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-[13px] font-bold text-[var(--ink-faint)]">Today</p>
          <h2
            className="mt-1 text-[22px] font-semibold text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Most co-ops stitch together a patchwork
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            Google Classroom is often too heavy-handed for this size. Course Wright
            replaces the scatter with one hub — and wins on usability first.
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
  );
}
