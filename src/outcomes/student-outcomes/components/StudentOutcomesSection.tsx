import { useToastOnError } from "@/ui/useToastOnError";
import { useStudentOutcomes } from "../hooks/useStudentOutcomes";

export function StudentOutcomesSection({ studentId }: { studentId: number }) {
  const outcomes = useStudentOutcomes(studentId);
  useToastOnError(outcomes.error);

  if (outcomes.loading || outcomes.groups.length === 0) return null;

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Outcomes</h2>
      <ul className="mt-3 flex flex-col gap-4">
        {outcomes.groups.map((group) => (
          <li key={group.courseId}>
            <p className="text-[14px] font-extrabold text-[var(--ink)]">{group.courseTitle}</p>
            <ul className="mt-1 flex flex-col gap-1">
              {group.lines.map((line) => (
                <li
                  key={`${line.text}-${line.label}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-[14px]"
                >
                  <span className="text-[var(--ink)]">{line.text}</span>
                  <span className="font-bold text-[var(--ink-soft)]">{line.label}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
