import { Avatar } from "@/ui/Avatar";
import type { ParentDashboardStudent } from "@/parent/model/dashboard";

export function ParentStudentTags({
  students,
  selectedIds,
  onToggle,
}: {
  students: ParentDashboardStudent[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Students">
      {students.map((student) => {
        const active = selectedIds.includes(student.id);
        return (
          <button
            key={student.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(student.id)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-bold",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
              active
                ? "border-[var(--green)] bg-[var(--green-tint)] text-[var(--green-deep)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-faint)]",
            ].join(" ")}
          >
            <Avatar name={student.name} size={20} />
            {student.name}
          </button>
        );
      })}
    </div>
  );
}
