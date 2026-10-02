import { useQuery } from "@tanstack/react-query";
import { listFamilyPeriodFeedback, periodFeedbackQueryKeys } from "@/grading/databridge/periodFeedback";
import { groupPeriodFeedback } from "@/grading/model/periodFeedback";
import { useToastOnError } from "@/ui/useToastOnError";

export function StudentPeriodFeedbackSection({ studentId }: { studentId: number }) {
  const query = useQuery({
    queryKey: periodFeedbackQueryKeys.student(studentId),
    queryFn: () => listFamilyPeriodFeedback(studentId),
    enabled: Number.isFinite(studentId),
  });
  useToastOnError(query.error instanceof Error ? query.error.message : null);
  const groups = groupPeriodFeedback(query.data ?? []);
  if (query.isLoading || groups.length === 0) return null;

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Period feedback</h2>
      <ul className="mt-3 flex flex-col gap-4">
        {groups.map((group) => (
          <li key={group.courseId}>
            <p className="text-[14px] font-extrabold text-[var(--ink)]">{group.courseTitle}</p>
            <ul className="mt-1 flex flex-col gap-2">
              {group.comments.map((comment) => (
                <li key={comment.cycleId}>
                  <p className="text-[12px] font-bold text-[var(--ink-soft)]">{comment.cycleLabel}</p>
                  <p className="text-[14px] text-[var(--ink)]">{comment.body}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
