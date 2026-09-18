import { Input } from "@/ui/Input";

const selectClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
  "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
].join(" ");

export function StudentProfileFields({
  name,
  parentEmail,
  gradeLevel,
  gradeLabels,
  disabled,
  onNameChange,
  onParentEmailChange,
  onGradeLevelChange,
}: {
  name: string;
  parentEmail: string;
  gradeLevel: string;
  gradeLabels: string[];
  disabled?: boolean;
  onNameChange: (value: string) => void;
  onParentEmailChange: (value: string) => void;
  onGradeLevelChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
        <Input
          className="w-full"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Parent email
        </span>
        <Input
          className="w-full"
          type="email"
          value={parentEmail}
          onChange={(event) => onParentEmailChange(event.target.value)}
          disabled={disabled}
          autoComplete="off"
          placeholder="optional"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Grade</span>
        <select
          className={selectClass}
          value={gradeLevel}
          onChange={(event) => onGradeLevelChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">No grade</option>
          {gradeLabels.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
