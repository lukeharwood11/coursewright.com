import type { ComponentType, SVGProps } from "react";
import { BookOpenIcon, BuildingOffice2Icon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import { eventAudienceLabel, type EventAudience } from "@/events/model/audience";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const audienceOptions: Array<{ value: EventAudience; Icon: IconComponent }> = [
  { value: "course", Icon: BookOpenIcon },
  { value: "class", Icon: UserGroupIcon },
  { value: "organization", Icon: BuildingOffice2Icon },
];

const segmentIdle =
  "inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-[9px] text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60";

const segmentActive =
  "inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-[9px] text-[13px] font-bold bg-[var(--green-tint)] text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]";

function TargetChecklist({
  label,
  emptyHint,
  options,
  selectedIds,
  disabled,
  onToggle,
}: {
  label: string;
  emptyHint: string;
  options: Array<{ id: number; name: string }>;
  selectedIds: number[];
  disabled: boolean;
  onToggle: (id: number) => void;
}) {
  const selected = new Set(selectedIds);
  return (
    <fieldset className="mt-4">
      <legend className="text-[13px] font-bold text-[var(--ink-soft)]">{label}</legend>
      {options.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">{emptyHint}</p>
      ) : (
        <ul className="mt-2 max-h-56 divide-y divide-[var(--line-soft)] overflow-y-auto rounded-[6px] border border-[var(--line)]">
          {options.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-[var(--green)]"
                  checked={selected.has(option.id)}
                  disabled={disabled}
                  onChange={() => onToggle(option.id)}
                />
                <span className="text-[14px] font-semibold text-[var(--ink)]">
                  {option.name}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

function CourseChoice({
  options,
  selectedId,
  disabled,
  onSelect,
}: {
  options: Array<{ id: number; name: string }>;
  selectedId: number | null;
  disabled: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-[13px] font-bold text-[var(--ink-soft)]">Course</legend>
      {options.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
          No courses you can add this to yet.
        </p>
      ) : (
        <ul className="mt-2 max-h-56 divide-y divide-[var(--line-soft)] overflow-y-auto rounded-[6px] border border-[var(--line)]">
          {options.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2.5">
                <input
                  type="radio"
                  name="event-course"
                  className="h-4 w-4 shrink-0 accent-[var(--green)]"
                  checked={selectedId === option.id}
                  disabled={disabled}
                  onChange={() => onSelect(option.id)}
                />
                <span className="text-[14px] font-semibold text-[var(--ink)]">{option.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export function EventFormFields({
  audience,
  courseIds,
  classIds,
  title,
  location,
  startsOn,
  endsOn,
  startTime,
  endTime,
  courses,
  classes,
  disabled,
  onAudience,
  onSelectCourse,
  onToggleClass,
  onTitle,
  onLocation,
  onStartsOn,
  onEndsOn,
  onStartTime,
  onEndTime,
}: {
  audience: EventAudience;
  courseIds: number[];
  classIds: number[];
  title: string;
  location: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  courses: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string }>;
  disabled: boolean;
  onAudience: (audience: EventAudience) => void;
  onSelectCourse: (id: number) => void;
  onToggleClass: (id: number) => void;
  onTitle: (value: string) => void;
  onLocation: (value: string) => void;
  onStartsOn: (value: string) => void;
  onEndsOn: (value: string) => void;
  onStartTime: (value: string) => void;
  onEndTime: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-[var(--ink-soft)]">
        Title
        <Input
          className="mt-1 w-full"
          value={title}
          disabled={disabled}
          onChange={(event) => onTitle(event.target.value)}
        />
      </label>
      <label className="mt-4 block text-[13px] font-bold text-[var(--ink-soft)]">
        Location
        <Input
          className="mt-1 w-full"
          value={location}
          maxLength={200}
          disabled={disabled}
          placeholder="Where it happens"
          onChange={(event) => onLocation(event.target.value)}
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-[13px] font-bold text-[var(--ink-soft)]">Who it’s for</legend>
        <div className="mt-2 flex w-full overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]">
          {audienceOptions.map((option) => {
            const active = audience === option.value;
            const Icon = option.Icon;
            return (
              <button
                key={option.value}
                type="button"
                className={active ? segmentActive : segmentIdle}
                disabled={disabled}
                onClick={() => onAudience(option.value)}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {eventAudienceLabel(option.value)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {audience === "course" ? (
        <CourseChoice
          options={courses}
          selectedId={courseIds[0] ?? null}
          disabled={disabled}
          onSelect={onSelectCourse}
        />
      ) : null}
      {audience === "class" ? (
        <TargetChecklist
          label="Classes"
          emptyHint="No classes yet."
          options={classes}
          selectedIds={classIds}
          disabled={disabled}
          onToggle={onToggleClass}
        />
      ) : null}
      {audience === "organization" ? (
        <p className="mt-4 text-[12.5px] text-[var(--ink-faint)]">
          Everyone in the organization can see this.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-[13px] font-bold text-[var(--ink-soft)]">
          Starts
          <input
            type="date"
            className={`${controlClass} mt-1`}
            value={startsOn}
            disabled={disabled}
            onChange={(event) => onStartsOn(event.target.value)}
          />
        </label>
        <label className="block text-[13px] font-bold text-[var(--ink-soft)]">
          Ends
          <input
            type="date"
            className={`${controlClass} mt-1`}
            value={endsOn}
            disabled={disabled}
            onChange={(event) => onEndsOn(event.target.value)}
          />
        </label>
        <label className="block text-[13px] font-bold text-[var(--ink-soft)]">
          Start time
          <input
            type="time"
            className={`${controlClass} mt-1`}
            value={startTime}
            disabled={disabled}
            onChange={(event) => onStartTime(event.target.value)}
          />
        </label>
        <label className="block text-[13px] font-bold text-[var(--ink-soft)]">
          End time
          <input
            type="time"
            className={`${controlClass} mt-1`}
            value={endTime}
            disabled={disabled}
            onChange={(event) => onEndTime(event.target.value)}
          />
        </label>
      </div>
      <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
        Leave the end date blank for one day. Times are optional and show on the day view.
      </p>
    </div>
  );
}
