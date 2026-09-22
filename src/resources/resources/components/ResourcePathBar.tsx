import { Link } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import type { ResourceFolderRecord } from "@/resources/databridge/folders";
import { resourceBrowsePath } from "@/resources/model/paths";

const crumbLink =
  "inline-flex items-center font-bold text-[var(--green)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

const rootIconClass = "h-4 w-4";

export function ResourcePathBar({
  orgSlug,
  currentFolder,
  ancestors,
}: {
  orgSlug: string;
  currentFolder: ResourceFolderRecord | null;
  ancestors: ResourceFolderRecord[];
}) {
  const trail =
    ancestors.length > 0 ? ancestors : currentFolder ? [currentFolder] : [];
  const parents = trail.slice(0, -1);
  const current = trail.at(-1) ?? null;

  return (
    <nav className="flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-[var(--ink-soft)]" aria-label="Folder path">
        {current ? (
          <Link
            to={resourceBrowsePath(orgSlug, null)}
            className={crumbLink}
            aria-label="Resources"
            title="Resources"
          >
            <HomeIcon className={rootIconClass} aria-hidden />
          </Link>
        ) : (
          <span
            className="inline-flex items-center font-bold text-[var(--ink)]"
            aria-current="page"
            aria-label="Resources"
            title="Resources"
          >
            <HomeIcon className={rootIconClass} aria-hidden />
          </span>
        )}
        {parents.map((folder) => (
          <span key={folder.id} className="inline-flex min-w-0 items-center gap-1">
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
            <Link
              to={resourceBrowsePath(orgSlug, folder.id)}
              className={`${crumbLink} max-w-[12rem] truncate`}
            >
              {folder.name}
            </Link>
          </span>
        ))}
        {current ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
            <span className="max-w-[16rem] truncate font-bold text-[var(--ink)]">
              {current.name}
            </span>
          </span>
        ) : null}
    </nav>
  );
}
