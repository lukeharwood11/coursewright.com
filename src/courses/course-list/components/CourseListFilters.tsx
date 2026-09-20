import { useEffect, useId, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";

const selectClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function CourseListFilters({
  query,
  subject,
  subjects,
  grades,
  gradeLabels,
  hasFilters,
  onQueryChange,
  onSubjectChange,
  onToggleGrade,
  onClear,
}: {
  query: string;
  subject: string;
  subjects: string[];
  grades: string[];
  gradeLabels: string[];
  hasFilters: boolean;
  onQueryChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onToggleGrade: (label: string) => void;
  onClear: () => void;
}) {
  const advancedId = useId();
  const [advancedOpen, setAdvancedOpen] = useState(grades.length > 0);

  useEffect(() => {
    if (grades.length > 0) setAdvancedOpen(true);
  }, [grades.length]);

  const showAdvanced = gradeLabels.length > 0;

  return (
    <div className="mt-6 space-y-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 sm:max-w-sm">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Find a course
          </span>
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, subject, location, or grade"
          />
        </label>
        <label className="flex min-w-[10rem] flex-col gap-1 sm:w-44">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Subject</span>
          <select
            className={selectClass}
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {showAdvanced ? (
          <Button
            type="button"
            variant="secondary"
            aria-expanded={advancedOpen}
            aria-controls={advancedId}
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            {advancedOpen ? (
              <ChevronUpIcon className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDownIcon className="h-4 w-4" aria-hidden />
            )}
            Advanced search
          </Button>
        ) : null}
        {hasFilters ? (
          <Button type="button" variant="secondary" onClick={onClear}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {showAdvanced && advancedOpen ? (
        <fieldset id={advancedId}>
          <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
            Grades
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {gradeLabels.map((label) => {
              const checked = grades.includes(label);
              return (
                <label
                  key={label}
                  className={[
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[13px] font-semibold",
                    checked
                      ? "border-[var(--green)] bg-[var(--green-tint)] text-[var(--green-deep)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:border-[var(--green)]",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => onToggleGrade(label)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
