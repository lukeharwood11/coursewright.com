import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  TableCellsIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { ButtonLink } from "@/ui/Button";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import {
  deleteReportCard,
  refreshReportCard,
  type ReportCardRecord,
  reportCardQueryKeys,
} from "@/grading/databridge/reportCards";
import { gradebookPath, reportCardPath } from "@/grading/model/paths";
import { caughtErrorMessage } from "@/ui/toast";

const itemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60";

const triggerClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-[11px] text-[var(--ink)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

const destructiveItemClassName =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[#c42b2b] hover:bg-[#fde8e8] hover:text-[#a82424] focus-visible:bg-[#fde8e8] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60";

export function ReportCardListActions({
  orgSlug,
  card,
  openLabel = "Open",
  canManage,
  studentProfileId,
  courseId,
}: {
  orgSlug: string;
  card: ReportCardRecord;
  openLabel?: string;
  canManage: boolean;
  studentProfileId?: number;
  courseId?: number;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const queryClient = useQueryClient();
  const isDraft = card.status === "draft";

  async function invalidateLists() {
    const studentId = studentProfileId ?? card.studentProfileId;
    const course = courseId ?? card.courseId;
    await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.detail(card.id) });
    await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.student(studentId) });
    await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.course(course) });
  }

  const refresh = useMutation({
    mutationFn: () => refreshReportCard(card.id),
    onSuccess: async () => {
      toast("Grades refreshed from the gradebook.");
      await invalidateLists();
    },
    onError: (error: Error) => toast(caughtErrorMessage(error)),
  });

  const discard = useMutation({
    mutationFn: () => deleteReportCard(card.id),
    onSuccess: async () => {
      toast("Draft discarded.");
      await invalidateLists();
    },
    onError: (error: Error) => toast(caughtErrorMessage(error)),
  });

  const busy = refresh.isPending || discard.isPending;

  return (
    <>
      <span className="inline-flex items-center gap-2">
        <ButtonLink variant="secondary" to={reportCardPath(orgSlug, card.id)}>
          {openLabel}
        </ButtonLink>
        {canManage ? (
          <>
            <button
              ref={buttonRef}
              type="button"
              className={triggerClassName}
              aria-label="Report card actions"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={menuId}
              disabled={busy}
              onClick={() => setOpen((value) => !value)}
            >
              <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
            </button>

            <AnchoredPopup
              open={open}
              onClose={() => setOpen(false)}
              anchorRef={buttonRef}
              id={menuId}
              label="Report card actions"
              preferredAlign="end"
              className="min-w-[12rem]"
            >
              <div className="py-1" role="menu">
                <Link
                  role="menuitem"
                  to={gradebookPath(orgSlug, card.courseId)}
                  className={itemClassName}
                  onClick={() => setOpen(false)}
                >
                  <TableCellsIcon className="h-4 w-4 shrink-0" aria-hidden />
                  Open gradebook
                </Link>
                {isDraft ? (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      className={itemClassName}
                      disabled={refresh.isPending}
                      onClick={() => {
                        setOpen(false);
                        refresh.mutate();
                      }}
                    >
                      <ArrowPathIcon className="h-4 w-4 shrink-0" aria-hidden />
                      {refresh.isPending ? "Refreshing…" : "Refresh grades"}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={destructiveItemClassName}
                      disabled={discard.isPending}
                      onClick={() => {
                        setOpen(false);
                        setConfirmDiscard(true);
                      }}
                    >
                      <TrashIcon className="h-4 w-4 shrink-0" aria-hidden />
                      Discard draft
                    </button>
                  </>
                ) : null}
              </div>
            </AnchoredPopup>
          </>
        ) : null}
      </span>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this draft?"
        body="The comment and grade snapshot will be removed. You can draft a new report card later."
        confirmLabel={discard.isPending ? "Discarding…" : "Discard draft"}
        onConfirm={() => {
          setConfirmDiscard(false);
          discard.mutate();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
