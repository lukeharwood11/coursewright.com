import { lazy, Suspense, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Input } from "@/ui/Input";
import { PageFormActions } from "@/ui/PageFormActions";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { PageEditorMediaProvider } from "@/materials/material/components/PageEditorMediaContext";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useResourceEdit } from "./hooks/useResourceEdit";
import { resourceItemPath } from "@/resources/model/paths";

const PageContentEditor = lazy(async () => {
  const module = await import("@/materials/material/components/PageContentEditor");
  return { default: module.PageContentEditor };
});

export function ResourceEditPage() {
  const edit = useResourceEdit();
  const page = edit.page;
  const user = useAuthedUser();
  useToastOnError(edit.error ?? page.error);

  useEffect(() => {
    document.title = page.item
      ? `Edit ${page.item.title} · Course Wright`
      : "Edit resource · Course Wright";
  }, [page.item]);

  if (!page.canEdit && !page.loading && page.item) {
    return (
      <Navigate
        to={resourceItemPath(page.organization.slug, page.item.id)}
        replace
      />
    );
  }

  if (page.loading || (page.item?.type === "document" && page.blocksLoading)) {
    return <PageLoading label="Loading editor…" />;
  }

  if (page.notFound || !page.item) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          We couldn’t open that editor.
        </p>
      </div>
    );
  }

  const viewHref = resourceItemPath(page.organization.slug, page.item.id);

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Edit {page.item.title}
          </h1>
          <p className="mt-2 text-[13px]">
            <Link
              to={viewHref}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back
            </Link>
          </p>
        </div>
        <PageFormActions
          formId={edit.formId}
          saving={edit.saving}
          hasChanges={edit.hasChanges}
          cancelTo={viewHref}
        />
      </div>

      <form
        id={edit.formId}
        className="mt-6 max-w-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          void edit.save();
        }}
      >
        <label className="block text-[13px] font-bold text-[var(--ink-soft)]">
          Name
          <Input
            className="mt-1 w-full"
            value={edit.title}
            onChange={(event) => edit.setTitle(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-[13px] font-bold text-[var(--ink-soft)]">
          Description
          <Input
            className="mt-1 w-full"
            value={edit.description}
            onChange={(event) => edit.setDescription(event.target.value)}
          />
        </label>
        {page.item.type === "link" ? (
          <label className="mt-4 block text-[13px] font-bold text-[var(--ink-soft)]">
            Web address
            <Input
              className="mt-1 w-full"
              value={edit.url}
              onChange={(event) => edit.setUrl(event.target.value)}
            />
          </label>
        ) : null}
      </form>

      {page.item.type === "document" ? (
        <div className="mt-8 max-w-3xl">
          <PageEditorMediaProvider
            value={{ organizationId: page.organization.id, userId: user.id }}
          >
            <Suspense fallback={<PageLoading embedded label="Loading editor…" />}>
              <PageContentEditor
                blocks={page.blocks}
                editorKey={`resource-edit-${page.item.id}`}
                editable
                onDraftChange={edit.onDraftChange}
              />
            </Suspense>
          </PageEditorMediaProvider>
        </div>
      ) : null}

      {page.item.type === "file" ? (
        <p className="mt-6 max-w-xl text-[14px] text-[var(--ink-soft)]">
          This name is what people see in Resources. The file itself keeps its original
          filename.
        </p>
      ) : null}
    </div>
  );
}
