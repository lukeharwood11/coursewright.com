import type { ComponentProps } from "react";
import { useEffect, useId, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";

const selectClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

/** Matches `Input` / subject `select` control height in this toolbar. */
const filterControlButtonClass =
  "box-border min-h-[46px] w-auto shrink-0 items-center justify-center px-3 py-[11px] text-[14.5px] leading-normal";

/** `text-[13px] font-bold` label row above fields — height only, no width. */
const filterFieldLabelSpacerClass = "block h-[19px] w-0 shrink-0 overflow-hidden";

function FilterToolbarButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return <Button variant="secondary" className={[filterControlButtonClass, className].filter(Boolean).join(" ")} {...props} />;
}

function SubjectSelect({
  value,
  subjects,
  onChange,
}: {
  value: string;
  subjects: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      className={selectClass}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">All subjects</option>
      {subjects.map((subject) => (
        <option key={subject} value={subject}>
          {subject}
        </option>
      ))}
    </select>
  );
}

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
  const [advancedOpen, setAdvancedOpen] = useState(
    grades.length > 0 || subject.length > 0,
  );

  useEffect(() => {
    if (grades.length > 0 || subject.length > 0) setAdvancedOpen(true);
  }, [grades.length, subject]);

  const hasGrades = gradeLabels.length > 0;
  const hasSubjects = subjects.length > 0;
  const showAdvancedToggle = hasGrades || hasSubjects;
  const advancedToggleClass = !hasGrades && hasSubjects ? "sm:hidden" : "";

  return (
    <div className="mt-3 space-y-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[12rem] sm:max-w-sm">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Find a course
          </span>
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, subject, location, or grade"
          />
        </label>
        {hasSubjects ? (
          <label className="hidden min-w-[10rem] flex-col gap-1 sm:flex sm:w-44">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Subject</span>
            <SubjectSelect
              value={subject}
              subjects={subjects}
              onChange={onSubjectChange}
            />
          </label>
        ) : null}
        {showAdvancedToggle ? (
          <div className={`flex w-fit flex-col items-start gap-1 ${advancedToggleClass}`}>
            <span className={filterFieldLabelSpacerClass} aria-hidden />
            <FilterToolbarButton
              type="button"
              aria-expanded={advancedOpen}
              aria-controls={advancedId}
              aria-label="Advanced search"
              className="w-[46px] gap-0 px-0 sm:w-auto sm:gap-2 sm:px-3"
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              {advancedOpen ? (
                <ChevronUpIcon className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <ChevronDownIcon className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span className="hidden sm:inline">Advanced search</span>
            </FilterToolbarButton>
          </div>
        ) : null}
        {hasFilters ? (
          <div className="flex w-fit flex-col items-start gap-1">
            <span className={filterFieldLabelSpacerClass} aria-hidden />
            <FilterToolbarButton type="button" onClick={onClear}>
              <span className="hidden sm:inline">Clear filters</span>
              <span className="sm:hidden">Clear</span>
            </FilterToolbarButton>
          </div>
        ) : null}
      </div>

      {showAdvancedToggle && advancedOpen ? (
        <div id={advancedId} className="space-y-3">
          {hasSubjects ? (
            <label className="flex flex-col gap-1 sm:hidden">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Subject</span>
              <SubjectSelect
                value={subject}
                subjects={subjects}
                onChange={onSubjectChange}
              />
            </label>
          ) : null}
          {hasGrades ? (
            <fieldset>
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
      ) : null}
    </div>
  );
}
