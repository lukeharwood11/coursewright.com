import { NavLink } from "react-router-dom";
import {
  helpDocNav,
  helpDocPath,
  helpDocTopics,
} from "../../model/helpDocs";

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "block rounded-[var(--r-sm)] px-2.5 py-1.5 text-[13.5px] font-bold",
    isActive
      ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
      : "text-[var(--ink-soft)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
  ].join(" ");
}

type DocsSidebarProps = {
  onNavigate?: () => void;
};

export function DocsSidebar({ onNavigate }: DocsSidebarProps) {
  return (
    <nav aria-label="Help topics" className="flex flex-col gap-5">
      {helpDocNav.map((group, index) => (
        <div key={group.heading ?? `group-${index}`}>
          {group.heading ? (
            <p className="mb-1.5 px-2.5 text-[11.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
              {group.heading}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.slugs.map((slug) => {
              const topic = helpDocTopics.find((item) => item.slug === slug);
              if (!topic) return null;
              return (
                <li key={topic.slug || "getting-started"}>
                  <NavLink
                    to={helpDocPath(topic.slug)}
                    end={topic.slug === ""}
                    className={linkClass}
                    onClick={onNavigate}
                  >
                    {topic.navLabel}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
