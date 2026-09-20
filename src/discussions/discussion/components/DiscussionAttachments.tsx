import { Link } from "react-router-dom";
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

  return (
    <ul className="mt-3 flex flex-col gap-3">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          {attachment.kind === "file" && attachment.file ? (
            <FileMaterialBody
              file={attachment.file}
              fileUrl={attachment.fileUrl}
              fileDownloadUrl={attachment.fileDownloadUrl}
            />
          ) : null}
          {attachment.kind === "material" && attachment.material ? (
            <Link
              to={materialPath({
                orgSlug,
                courseId: attachment.material.courseId,
                unitId: attachment.material.unitId,
                materialId: attachment.material.id,
              })}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {attachment.label.trim() || attachment.material.title}
            </Link>
          ) : null}
          {attachment.kind === "url" && attachment.url ? (
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {attachment.label.trim() || attachment.url}
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
