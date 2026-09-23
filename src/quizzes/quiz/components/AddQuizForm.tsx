import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { useToastOnError } from "@/ui/useToastOnError";
import { useAddQuiz } from "../hooks/useAddQuiz";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function AddQuizForm({
  organizationId,
  orgSlug,
  courseId,
  unitId,
  fromUnitPage = false,
  formOnly = false,
  onCancel,
}: {
  organizationId: number;
  orgSlug: string;
  courseId: number;
  unitId: number;
  fromUnitPage?: boolean;
  /** Skip the trigger button; parent mounts this only when the form should show. */
  formOnly?: boolean;
  onCancel?: () => void;
}) {
  const add = useAddQuiz({
    organizationId,
    orgSlug,
    courseId,
    unitId,
    fromUnitPage,
  });
  useToastOnError(add.error);

  function close() {
    add.setOpen(false);
    onCancel?.();
  }

  if (!formOnly && !add.open) {
    return (
      <Button variant="ghost" fullWidth onClick={() => add.setOpen(true)}>
        <PlusIcon className="h-5 w-5" aria-hidden />
        Add quiz
      </Button>
    );
  }

  return (
    <form
      onSubmit={add.onSubmit}
      className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4"
    >
      <p className="text-[13px] font-bold text-[var(--ink-soft)]">Add quiz</p>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
        <Input
          className="w-full"
          required
          value={add.title}
          onChange={(event) => add.setTitle(event.target.value)}
        />
      </label>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Description</span>
        <textarea
          className={`${controlClass} min-h-[4.5rem] resize-y`}
          value={add.description}
          onChange={(event) => add.setDescription(event.target.value)}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" disabled={add.submitting}>
          <CheckIcon className="h-4 w-4" aria-hidden />
          {add.submitting ? "Adding…" : "Add quiz"}
        </Button>
        <Button type="button" variant="secondary" onClick={close}>
          <XMarkIcon className="h-4 w-4" aria-hidden />
          Cancel
        </Button>
      </div>
    </form>
  );
}
