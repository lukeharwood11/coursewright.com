import { Link } from "react-router-dom";
import { BookOpenIcon, LinkIcon } from "@heroicons/react/24/outline";
import { FileMaterialBody } from "@/materials/material/components/FileMaterialBody";
import { materialPath } from "@/materials/model/paths";
import type { DiscussionAttachmentRecord } from "@/discussions/databridge/discussions";

export function DiscussionAttachments({
  orgSlug,
  attachments,
}: {
  orgSlug: string;
  attachments: DiscussionAttachmentRecord[];
}) {
  if (attachments.length === 0) return null;

  const files = attachments.filter((row) => row.kind === "file");
  const links = attachments.filter(
    (row) => row.kind === "material" || row.kind === "url",
  );

  return (
    <div className="mt-2 flex flex-col gap-2">
      {files.map((attachment) =>
        attachment.file ? (
          <div key={attachment.id}>
            <FileMaterialBody
              file={attachment.file}
              fileUrl={attachment.fileUrl}
              fileDownloadUrl={attachment.fileDownloadUrl}
            />
          </div>
        ) : null,
      )}
      {links.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {links.map((attachment) => {
            if (attachment.kind === "material" && attachment.material) {
              const label =
                attachment.label.trim() || attachment.material.title;
              return (
                <li key={attachment.id}>
                  <Link
                    to={materialPath({
                      orgSlug,
                      courseId: attachment.material.courseId,
                      unitId: attachment.material.unitId,
                      materialId: attachment.material.id,
                    })}
                    className="flex items-center gap-2.5 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2.5 text-[13.5px] font-bold text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
                  >
                    <BookOpenIcon
                      className="h-4 w-4 shrink-0 text-[var(--green)]"
                      aria-hidden
                    />
                    <span className="min-w-0 truncate">{label}</span>
                  </Link>
                </li>
              );
            }
            if (attachment.kind === "url" && attachment.url) {
              const label = attachment.label.trim() || attachment.url;
              return (
                <li key={attachment.id}>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2.5 text-[13.5px] font-bold text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
                  >
                    <LinkIcon
                      className="h-4 w-4 shrink-0 text-[var(--green)]"
                      aria-hidden
                    />
                    <span className="min-w-0 truncate">{label}</span>
                  </a>
                </li>
              );
            }
            return null;
          })}
        </ul>
      ) : null}
    </div>
  );
}
