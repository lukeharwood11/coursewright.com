import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { isNetworkError } from "@/ui/networkError";
import type { ResourceFolderRecord } from "@/resources/databridge/folders";
import type { ResourceItemRecord } from "@/resources/databridge/items";
import type { ResourceAudience } from "@/resources/model/access";
import {
  resourceBrowsePath,
  resourceItemEditPath,
  resourceItemPrintPath,
  resourceItemsPrintPath,
} from "@/resources/model/paths";
import {
  mergeSelection,
  selectionActions,
  selectionKey,
  toggleSelection,
  type SelectedResource,
} from "@/resources/model/selection";
import { AccessSettingsDialog } from "./components/AccessSettingsDialog";
import { MoveResourceDialog } from "./components/MoveResourceDialog";
import { ResourceBrowser } from "./components/ResourceBrowser";
import { ResourceContextMenu } from "./components/ResourceContextMenu";
import {
  FolderNameDialog,
  LinkResourceDialog,
} from "./components/ResourceCreateDialogs";
import { ResourceDropzone } from "./components/ResourceDropzone";
import { ResourcePathBar } from "./components/ResourcePathBar";
import { ResourceSelectionBar } from "./components/ResourceSelectionBar";
import { ResourceToolbar } from "./components/ResourceToolbar";
import { useResourcesBrowse } from "./hooks/useResourcesBrowse";

type MoveTarget =
  | {
      kind: "folder";
      id: number;
      parentId: number | null;
      aclInherit: boolean;
    }
  | { kind: "item"; id: number; folderId: number | null };

type AccessTarget = {
  kind: "folder" | "item";
  id: number;
  canInherit: boolean;
  audience: ResourceAudience;
  aclInherit: boolean;
  parentId: number | null;
  folderId: number | null;
  visibility: "unpublished" | "published" | null;
};

type RemoveTarget = { kind: "folder" | "item"; id: number; name: string };

export function ResourcesPage() {
  const page = useResourcesBrowse();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folderDialog, setFolderDialog] = useState(false);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [linkDialog, setLinkDialog] = useState(false);
  const [move, setMove] = useState<MoveTarget | null>(null);
  const [access, setAccess] = useState<AccessTarget | null>(null);
  const [remove, setRemove] = useState<RemoveTarget | null>(null);
  const [selected, setSelected] = useState<SelectedResource[]>([]);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const [batchRemoveOpen, setBatchRemoveOpen] = useState(false);
  const selectedKeys = useMemo(
    () => new Set(selected.map(selectionKey)),
    [selected],
  );
  useToastOnError(page.error);
  const moveErrorForToast =
    move?.kind === "item"
      ? (page.moveItem.error?.message ?? null)
      : move?.kind === "folder"
        ? (page.moveFolder.error?.message ?? null)
        : null;
  useToastOnError(moveErrorForToast);
  useToastOnError(batchMoveOpen ? (page.batchMove.error?.message ?? null) : null);

  useEffect(() => {
    setSelected([]);
  }, [page.folderId, page.typeFilter]);

  useEffect(() => {
    document.title = page.currentFolder
      ? `${page.currentFolder.name} · Resources · Course Wright`
      : "Resources · Course Wright";
  }, [page.currentFolder]);

  if (page.loading) {
    return <PageLoading label="Loading resources…" />;
  }

  if (page.notFound) {
    return (
      <div className="px-5 py-4 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that folder
        </h1>
        <p className="mt-4 text-[13px]">
          <Link
            to={resourceBrowsePath(page.organization.slug, null)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to Resources
          </Link>
        </p>
      </div>
    );
  }

  const currentFolder = page.currentFolder;
  const title = currentFolder?.name ?? "Resources";

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function createDocument() {
    if (page.createDocument.isPending) return;
    void page.createDocument
      .mutateAsync("Untitled")
      .then((item) => {
        navigate(resourceItemEditPath(page.organization.slug, item.id));
      })
      .catch(() => undefined);
  }

  function openMoveFolder(folder: ResourceFolderRecord) {
    page.moveFolder.reset();
    setMove({
      kind: "folder",
      id: folder.id,
      parentId: folder.parentId,
      aclInherit: folder.aclInherit,
    });
  }

  function openMoveItem(item: ResourceItemRecord) {
    page.moveItem.reset();
    setMove({ kind: "item", id: item.id, folderId: item.folderId });
  }

  function openAccessFolder(folder: ResourceFolderRecord) {
    setAccess({
      kind: "folder",
      id: folder.id,
      canInherit: folder.parentId != null,
      audience: {
        parentsCanView: folder.parentsCanView,
        studentsCanView: folder.studentsCanView,
      },
      aclInherit: folder.aclInherit,
      parentId: folder.parentId,
      folderId: null,
      visibility: null,
    });
  }

  function openAccessItem(item: ResourceItemRecord) {
    setAccess({
      kind: "item",
      id: item.id,
      canInherit: true,
      audience: {
        parentsCanView: item.parentsCanView,
        studentsCanView: item.studentsCanView,
      },
      aclInherit: item.aclInherit,
      parentId: null,
      folderId: item.folderId,
      visibility: item.visibility,
    });
  }

  const movePending =
    move?.kind === "item" ? page.moveItem.isPending : page.moveFolder.isPending;
  const moveError =
    move?.kind === "item"
      ? (page.moveItem.error?.message ?? null)
      : (page.moveFolder.error?.message ?? null);
  const moveErrorDisplay =
    moveError && !isNetworkError(moveError) ? moveError : null;
  const batchMoveError = page.batchMove.error?.message ?? null;
  const batchMoveErrorDisplay =
    batchMoveError && !isNetworkError(batchMoveError) ? batchMoveError : null;
  const batchPending =
    page.batchMove.isPending ||
    page.batchArchive.isPending ||
    page.batchVisibility.isPending;
  const actions = selectionActions(selected);

  function toggleFolder(folder: ResourceFolderRecord, canEdit: boolean) {
    setSelected((rows) =>
      toggleSelection(rows, {
        kind: "folder",
        id: folder.id,
        parentId: folder.parentId,
        aclInherit: folder.aclInherit,
        canEdit,
      }),
    );
  }

  function toggleItem(item: ResourceItemRecord, canEdit: boolean) {
    setSelected((rows) =>
      toggleSelection(rows, {
        kind: "item",
        id: item.id,
        folderId: item.folderId,
        type: item.type,
        fileId: item.fileId,
        title: item.title,
        canEdit,
      }),
    );
  }

  function toggleAllVisible() {
    const incoming: SelectedResource[] = [
      ...page.folders.map(({ folder, canEdit }) => ({
        kind: "folder" as const,
        id: folder.id,
        parentId: folder.parentId,
        aclInherit: folder.aclInherit,
        canEdit,
      })),
      ...page.items.map(({ item, canEdit }) => ({
        kind: "item" as const,
        id: item.id,
        folderId: item.folderId,
        type: item.type,
        fileId: item.fileId,
        title: item.title,
        canEdit,
      })),
    ];
    const allOn =
      incoming.length > 0 &&
      incoming.every((row) =>
        selected.some((item) => selectionKey(item) === selectionKey(row)),
      );
    setSelected((rows) => mergeSelection(rows, incoming, !allOn));
  }

  function downloadSelection(files: { title: string; fileId: number }[]) {
    page.downloadFiles.mutate(files);
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-5 py-4 md:px-8">
      <ResourcePathBar
        orgSlug={page.organization.slug}
        currentFolder={page.currentFolder}
        ancestors={page.ancestors}
      />

      <div className="mt-3 flex items-center gap-2">
        <h1
          className="min-w-0 flex-1 truncate text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {page.canEditHere && currentFolder ? (
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            {page.isStaff ? (
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => openAccessFolder(currentFolder)}
              >
                <Cog6ToothIcon className="h-5 w-5" aria-hidden />
                <span className="max-sm:hidden">Manage access</span>
              </Button>
            ) : null}
            <CurrentFolderMenu
              onMove={() => openMoveFolder(currentFolder)}
              onRename={() => setRenameFolderOpen(true)}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <ResourceToolbar
          canEdit={page.canEditHere}
          typeFilter={page.typeFilter}
          onTypeFilter={page.setTypeFilter}
          onNewFolder={() => setFolderDialog(true)}
          onNewDocument={createDocument}
          onNewLink={() => setLinkDialog(true)}
          onUpload={openFilePicker}
          documentPending={page.createDocument.isPending}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            page.enqueueFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />

      <ResourceDropzone
        className={[
          "mt-4 flex min-h-0 flex-1 flex-col",
          actions.count > 0 ? "pb-24" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={!page.canEditHere}
        onFiles={page.enqueueFiles}
      >
        <ResourceBrowser
          orgSlug={page.organization.slug}
          organizationId={page.organization.id}
          folders={page.folders}
          items={page.items}
          actor={page.actor}
          grants={page.grants}
          knownFolders={page.foldersById}
          typeFilter={page.typeFilter}
          canEditHere={page.canEditHere}
          isStaff={page.isStaff}
          renamePending={page.renameFolder.isPending || page.renameItem.isPending}
          onRenameFolder={(id, name) =>
            page.renameFolder.mutateAsync({ id, name }).then(() => undefined)
          }
          onRenameItem={(id, title) =>
            page.renameItem.mutateAsync({ id, title }).then(() => undefined)
          }
          onMoveFolder={openMoveFolder}
          onMoveItem={openMoveItem}
          onAccessFolder={openAccessFolder}
          onAccessItem={openAccessItem}
          onRemoveFolder={(folder) =>
            setRemove({ kind: "folder", id: folder.id, name: folder.name })
          }
          onRemoveItem={(item) =>
            setRemove({ kind: "item", id: item.id, name: item.title })
          }
          onPublish={(item) =>
            page.setItemVisibility.mutate({ id: item.id, visibility: "published" })
          }
          onUnpublish={(item) =>
            page.setItemVisibility.mutate({ id: item.id, visibility: "unpublished" })
          }
          onDownload={(item) => {
            if (item.fileId == null) return;
            downloadSelection([{ title: item.title, fileId: item.fileId }]);
          }}
          onCreateFolder={() => setFolderDialog(true)}
          onCreateDocument={createDocument}
          onCreateLink={() => setLinkDialog(true)}
          onUpload={openFilePicker}
          selectedKeys={selectedKeys}
          onToggleFolder={toggleFolder}
          onToggleItem={toggleItem}
          onToggleAll={toggleAllVisible}
        />
      </ResourceDropzone>

      <ResourceSelectionBar
        count={actions.count}
        canMove={actions.canMove}
        canRemove={actions.canRemove}
        canPublish={actions.canPublish}
        canPrint={actions.printableIds.length > 0}
        canDownload={actions.files.length > 0}
        pending={batchPending}
        downloadPending={page.downloadFiles.isPending}
        onClear={() => setSelected([])}
        onMove={() => setBatchMoveOpen(true)}
        onRemove={() => setBatchRemoveOpen(true)}
        onPublish={() =>
          page.batchVisibility.mutate({
            ids: actions.editableItems.map((item) => item.id),
            visibility: "published",
          })
        }
        onUnpublish={() =>
          page.batchVisibility.mutate({
            ids: actions.editableItems.map((item) => item.id),
            visibility: "unpublished",
          })
        }
        onPrint={() => {
          const ids = actions.printableIds;
          if (ids.length === 1) {
            const only = ids[0];
            if (only) navigate(resourceItemPrintPath(page.organization.slug, only));
            return;
          }
          navigate(resourceItemsPrintPath(page.organization.slug, ids));
        }}
        onDownload={() => downloadSelection(actions.files)}
      />

      <FolderNameDialog
        open={folderDialog}
        pending={page.createFolder.isPending}
        onClose={() => setFolderDialog(false)}
        onSubmit={(name) => page.createFolder.mutateAsync(name)}
      />
      {currentFolder ? (
        <FolderNameDialog
          open={renameFolderOpen}
          pending={page.renameFolder.isPending}
          initialName={currentFolder.name}
          title="Rename folder"
          submitLabel="Save"
          pendingLabel="Saving…"
          onClose={() => setRenameFolderOpen(false)}
          onSubmit={(name) =>
            page.renameFolder.mutateAsync({ id: currentFolder.id, name })
          }
        />
      ) : null}
      <LinkResourceDialog
        open={linkDialog}
        pending={page.createLink.isPending}
        onClose={() => setLinkDialog(false)}
        onCreate={(input) => page.createLink.mutateAsync(input)}
      />

      {move ? (
        <MoveResourceDialog
          open
          organizationId={page.organization.id}
          currentFolderId={move.kind === "folder" ? move.parentId : move.folderId}
          excludeFolderId={move.kind === "folder" ? move.id : null}
          pending={movePending}
          error={moveErrorDisplay}
          onClose={() => setMove(null)}
          onMove={(parentId) => {
            const done =
              move.kind === "folder"
                ? page.moveFolder.mutateAsync({
                    id: move.id,
                    parentId,
                    aclInherit: move.aclInherit,
                  })
                : page.moveItem.mutateAsync({ id: move.id, folderId: parentId });
            void done.then(() => setMove(null)).catch(() => undefined);
          }}
        />
      ) : null}

      {batchMoveOpen ? (
        <MoveResourceDialog
          open
          organizationId={page.organization.id}
          currentFolderId={null}
          excludeFolderIds={actions.folders.map((folder) => folder.id)}
          requireDifferentDestination={false}
          pending={page.batchMove.isPending}
          error={batchMoveErrorDisplay}
          onClose={() => setBatchMoveOpen(false)}
          onMove={(parentId) => {
            void page.batchMove
              .mutateAsync({
                folders: actions.folders,
                items: actions.editableItems,
                parentId,
              })
              .then(() => {
                setBatchMoveOpen(false);
                setSelected([]);
              })
              .catch(() => undefined);
          }}
        />
      ) : null}

      <AccessSettingsDialog
        open={access != null}
        target={
          access
            ? {
                kind: access.kind,
                id: access.id,
                organizationId: page.organization.id,
                canInherit: access.canInherit,
              }
            : null
        }
        audience={access?.audience ?? { parentsCanView: false, studentsCanView: false }}
        aclInherit={access?.aclInherit ?? false}
        parentId={access?.parentId ?? null}
        folderId={access?.folderId ?? null}
        unpublished={access?.visibility === "unpublished"}
        onClose={() => setAccess(null)}
        onSaved={page.invalidateBrowse}
      />

      <ConfirmDialog
        open={remove != null}
        title={remove?.kind === "folder" ? "Remove this folder?" : "Remove this resource?"}
        body={
          remove?.kind === "folder"
            ? "This folder will be hidden from Resources. You can still ask an admin if you need it back."
            : "It will be hidden from Resources. You can still ask an admin if you need it back."
        }
        confirmLabel="Remove"
        cancelLabel="Keep"
        onCancel={() => setRemove(null)}
        onConfirm={() => {
          if (!remove) return;
          const target = remove;
          setRemove(null);
          if (target.kind === "folder") page.archiveFolder.mutate(target.id);
          else page.archiveItem.mutate(target.id);
        }}
      />

      <ConfirmDialog
        open={batchRemoveOpen}
        title={actions.count === 1 ? "Remove this?" : `Remove ${actions.count} items?`}
        body="They will be hidden from Resources. You can still ask an admin if you need them back."
        confirmLabel="Remove"
        cancelLabel="Keep"
        onCancel={() => setBatchRemoveOpen(false)}
        onConfirm={() => {
          setBatchRemoveOpen(false);
          void page.batchArchive
            .mutateAsync({
              folderIds: actions.folders.map((folder) => folder.id),
              itemIds: actions.editableItems.map((item) => item.id),
            })
            .then(() => setSelected([]))
            .catch(() => undefined);
        }}
      />
    </div>
  );
}

const menuTriggerClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

function CurrentFolderMenu({
  onMove,
  onRename,
}: {
  onMove: () => void;
  onRename: () => void;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const items = [
    {
      id: "rename",
      label: "Rename",
      icon: <PencilSquareIcon className="h-4 w-4" />,
      onSelect: onRename,
    },
    {
      id: "move",
      label: "Move",
      icon: <ArrowRightIcon className="h-4 w-4" />,
      onSelect: onMove,
    },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={menuTriggerClassName}
        aria-label="Folder actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </button>
      <ResourceContextMenu
        id={menuId}
        open={open}
        label="Folder actions"
        items={items}
        anchorRef={buttonRef}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
