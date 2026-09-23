import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { formatPercent } from "@/grading/model/scale";
import { gradebookPath, studentPath } from "@/grading/model/paths";
import { useReportCard } from "./hooks/useReportCard";

export function ReportCardPage() {
  const cardPage = useReportCard();
  const card = cardPage.card;

  useEffect(() => {
    document.title = card
      ? `Report card · ${card.snapshot.studentName} · Course Wright`
      : "Report card · Course Wright";
  }, [card]);

  if (cardPage.loading) return <PageLoading label="Loading report card…" />;

  if (!card) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1 className="text-[24px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          We couldn’t find that report card
        </h1>
      </div>
    );
  }

  const slug = cardPage.organization.slug;
  const draft = card.status === "draft" && cardPage.canEdit;
  const snapshot = card.snapshot;
  const finalText = snapshot.overrideLabel
    ? snapshot.overrideLabel
    : snapshot.finalLabel
      ? `${formatPercent(snapshot.finalPercent)} · ${snapshot.finalLabel}`
      : formatPercent(snapshot.finalPercent);

  return (
    <div>
      <DetailPageHeader
        backTo={studentPath(slug, card.studentProfileId)}
        backLabel="Back to student"
        title={`${snapshot.studentName}`}
        meta={snapshot.courseTitle}
        actions={
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            <PrinterIcon className="h-5 w-5" aria-hidden />
            Print
          </Button>
        }
      />
      <div className="space-y-6 px-5 py-4 md:px-8 print:px-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={card.status === "draft" ? "neutral" : "green"}>{card.status}</Badge>
          {cardPage.canEdit ? (
            <Link
              to={gradebookPath(slug, card.courseId)}
              className="text-[13px] font-bold text-[var(--green)]"
            >
              Open gradebook
            </Link>
          ) : null}
        </div>

        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Grades</h2>
          <p className="mt-2 text-[20px] font-semibold text-[var(--ink)]">{finalText}</p>
          {snapshot.items.length === 0 ? (
            <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No grades yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--line-soft)]">
              {snapshot.items.map((item) => (
                <li key={item.quizId} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-[14.5px] text-[var(--ink)]">{item.title}</span>
                  <span className="text-[14px] font-bold text-[var(--ink)]">
                    {item.locked
                      ? item.label
                        ? `${formatPercent(item.percent)} · ${item.label}`
                        : formatPercent(item.percent)
                      : "Not graded"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[12.5px] text-[var(--ink-faint)]">
            Grades come from the gradebook. Change a score there, then refresh this draft.
          </p>
        </section>

        <section>
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Comment</h2>
          {draft ? (
            <textarea
              className="mt-2 min-h-28 w-full max-w-2xl rounded-[6px] border border-[var(--line)] px-[13px] py-[11px] text-[14.5px]"
              value={cardPage.narrative}
              onChange={(event) => cardPage.setNarrative(event.target.value)}
            />
          ) : (
            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">
              {card.narrative.trim() || "No comment."}
            </p>
          )}
        </section>

        {draft ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={cardPage.saving} onClick={cardPage.saveNarrative}>
              {cardPage.saving ? "Saving…" : "Save comment"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={cardPage.refreshing}
              onClick={cardPage.refreshGrades}
            >
              {cardPage.refreshing ? "Refreshing…" : "Refresh grades"}
            </Button>
            <Button type="button" disabled={cardPage.submitting} onClick={cardPage.submitCard}>
              {cardPage.submitting ? "Sending…" : "Submit and send"}
            </Button>
          </div>
        ) : null}

        {cardPage.canEdit && card.status !== "draft" ? (
          <section>
            <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Email</h2>
            {cardPage.deliveries.filter((row) => row.channel === "email").length === 0 ? (
              <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No email deliveries.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {cardPage.deliveries
                  .filter((row) => row.channel === "email")
                  .map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center gap-2 text-[14px]">
                      <span className="font-bold text-[var(--ink)]">
                        {row.recipientKind === "student" ? "Student" : "Parent"}
                      </span>
                      <span className="text-[var(--ink-soft)]">{row.recipientEmail ?? "No email"}</span>
                      <Badge variant={row.status === "failed" ? "neutral" : "green"}>{row.status}</Badge>
                      {row.lastError ? (
                        <span className="text-[13px] text-[var(--amber-deep)]">{row.lastError}</span>
                      ) : null}
                      {row.status === "failed" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={cardPage.resendingId === row.id}
                          onClick={() => cardPage.resendDelivery(row.id)}
                        >
                          Resend
                        </Button>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
