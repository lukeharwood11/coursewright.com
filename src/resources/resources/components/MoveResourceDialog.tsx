import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/Select";
import {
  listOrgResourceFolders,
  resourceFolderQueryKeys,
} from "@/resources/databridge/folders";
import { folderIdsInSubtree, folderPathLabel } from "@/resources/model/tree";

export function MoveResourceDialog({
  open,
  organizationId,
  currentFolderId,
  excludeFolderId,
  onClose,
  onMove,
  pending,
  error,
}: {
  open: boolean;
  organizationId: number;
  currentFolderId: number | null;
  excludeFolderId?: number | null;
  onClose: () => void;
  onMove: (folderId: number | null) => void;
  pending: boolean;
  error: string | null;
}) {
  const [destination, setDestination] = useState(
    currentFolderId == null ? "" : String(currentFolderId),
  );

  useEffect(() => {
    setDestination(currentFolderId == null ? "" : String(currentFolderId));
  }, [currentFolderId, open]);

  const foldersQuery = useQuery({
    queryKey: resourceFolderQueryKeys.all(organizationId),
    queryFn: () => listOrgResourceFolders(organizationId),
    enabled: open,
  });
  const folders = foldersQuery.data ?? [];
  const excluded = useMemo(
    () =>
      excludeFolderId != null
        ? folderIdsInSubtree(folders, excludeFolderId)
        : new Set<number>(),
    [excludeFolderId, folders],
  );
  const foldersById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );
  const options = folders.filter((folder) => !excluded.has(folder.id));

  if (!open) return null;

  const nextFolderId = destination === "" ? null : Number(destination);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-move-title"
        className="relative w-full max-w-md rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id="resource-move-title"
          className="text-[15.5px] font-extrabold text-[var(--ink)]"
        >
          Move
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
          Choose a folder, or keep it at the top of Resources.
        </p>
        <label className="mt-4 block text-[13px] font-bold text-[var(--ink-soft)]">
          Folder
          <Select
            wrapperClassName="mt-1 w-full"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">Resources (top level)</option>
            {options.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folderPathLabel(foldersById, folder.id)}
              </option>
            ))}
          </Select>
        </label>
        {error ? (
          <p className="mt-3 text-[13.5px] text-[var(--amber-deep)]">{error}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || nextFolderId === currentFolderId}
            onClick={() => onMove(nextFolderId)}
          >
            {pending ? "Moving…" : "Move"}
          </Button>
        </div>
      </div>
    </div>
  );
}
