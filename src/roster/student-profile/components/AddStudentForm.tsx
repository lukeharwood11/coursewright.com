import type { FormEvent } from "react";
import { Button } from "@/ui/Button";
import { StudentProfileFields } from "@/roster/student-profile/components/StudentProfileFields";

export function AddStudentForm({
  name,
  parentEmail,
  studentEmail,
  gradeLevel,
  gradeLabels,
  error,
  saving,
  submitLabel,
  onNameChange,
  onParentEmailChange,
  onStudentEmailChange,
  onGradeLevelChange,
  onSubmit,
}: {
  name: string;
  parentEmail: string;
  studentEmail: string;
  gradeLevel: string;
  gradeLabels: string[];
  error: string | null;
  saving: boolean;
  submitLabel: string;
  onNameChange: (value: string) => void;
  onParentEmailChange: (value: string) => void;
  onStudentEmailChange: (value: string) => void;
  onGradeLevelChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <StudentProfileFields
        name={name}
        parentEmail={parentEmail}
        studentEmail={studentEmail}
        gradeLevel={gradeLevel}
        gradeLabels={gradeLabels}
        disabled={saving}
        onNameChange={onNameChange}
        onParentEmailChange={onParentEmailChange}
        onStudentEmailChange={onStudentEmailChange}
        onGradeLevelChange={onGradeLevelChange}
      />
      {error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Adding…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
