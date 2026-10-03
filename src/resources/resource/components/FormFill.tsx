import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { caughtErrorMessage } from "@/ui/toast";
import {
  getOrgFormByItemId,
  listFormSubjectStudents,
  listOrgFormSubmissions,
  orgFormQueryKeys,
  submitOrgForm,
} from "@/resources/databridge/forms";
import {
  formAnswersPayload,
  formatFormAnswer,
  validateFormAnswers,
  type FormAnswers,
} from "@/resources/model/formSchema";

const labelClass = "block text-[13px] font-bold text-[var(--ink-soft)]";

function stringAnswer(value: FormAnswers[string] | undefined): string {
  return typeof value === "string" ? value : "";
}

export function FormFill({
  organizationId,
  itemId,
  published,
  canEdit,
  userId,
}: {
  organizationId: number;
  itemId: number;
  published: boolean;
  canEdit: boolean;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const formQuery = useQuery({
    queryKey: orgFormQueryKeys.byItem(itemId),
    queryFn: () => getOrgFormByItemId(itemId),
  });
  const form = formQuery.data ?? null;
  const studentsQuery = useQuery({
    queryKey: orgFormQueryKeys.students(organizationId),
    queryFn: () => listFormSubjectStudents(organizationId),
    enabled: Boolean(form && form.schema.subject !== "none" && published),
  });
  const submissionsQuery = useQuery({
    queryKey: form ? orgFormQueryKeys.submissions(form.id) : ["org-forms", "submissions", 0],
    queryFn: () => listOrgFormSubmissions(form!.id),
    enabled: Boolean(form),
  });
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error("This form isn’t ready yet.");
      const subjectStudentId = studentId ? Number(studentId) : null;
      const message = validateFormAnswers({
        schema: form.schema,
        answers,
        subjectStudentId: Number.isFinite(subjectStudentId) ? subjectStudentId : null,
      });
      if (message) throw new Error(message);
      await submitOrgForm({
        organizationId,
        formId: form.id,
        submittedBy: userId,
        subjectStudentProfileId:
          form.schema.subject === "none" || !Number.isFinite(subjectStudentId)
            ? null
            : subjectStudentId,
        payload: formAnswersPayload(form.schema, answers),
      });
    },
    onSuccess: async () => {
      setAnswers({});
      setStudentId("");
      setError(null);
      setSent(true);
      if (form) {
        await queryClient.invalidateQueries({
          queryKey: orgFormQueryKeys.submissions(form.id),
        });
      }
    },
    onError: (caught: Error) => {
      setSent(false);
      setError(caughtErrorMessage(caught));
    },
  });

  if (formQuery.isLoading) {
    return <p className="mt-4 text-[14px] text-[var(--ink-soft)]">Loading form…</p>;
  }
  if (!form) {
    return (
      <p className="mt-4 text-[14px] text-[var(--ink-soft)]">
        This form isn’t ready yet.
      </p>
    );
  }

  const submissions = submissionsQuery.data ?? [];
  const visibleSubmissions = canEdit
    ? submissions
    : submissions.filter((row) => row.submittedBy === userId);

  return (
    <div className="mt-4 space-y-8">
      {!published ? (
        <p className="text-[14px] text-[var(--ink-soft)]">
          Publish this form before anyone can respond. People who can open the published
          form can send a response. Editing the resource is not the same as course materials.
        </p>
      ) : (
        <form
          className="max-w-xl space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate();
          }}
        >
          {form.schema.subject !== "none" ? (
            <label className={labelClass}>
              Student
              {form.schema.subject === "required" ? " (required)" : " (optional)"}
              <Select
                wrapperClassName="mt-1 block w-full"
                value={studentId}
                onChange={(event) => {
                  setSent(false);
                  setStudentId(event.target.value);
                }}
              >
                <option value="">
                  {form.schema.subject === "required" ? "Choose a student" : "No student"}
                </option>
                {(studentsQuery.data ?? []).map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          {form.schema.fields.length === 0 ? (
            <p className="text-[14px] text-[var(--ink-soft)]">
              This form has no questions yet.
            </p>
          ) : null}

          {form.schema.fields.map((field) => (
            <label key={field.id} className={labelClass}>
              {field.label}
              {field.required ? " (required)" : ""}
              {field.kind === "long_text" ? (
                <textarea
                  className="mt-1 min-h-28 w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]"
                  value={stringAnswer(answers[field.id])}
                  onChange={(event) => {
                    setSent(false);
                    setAnswers({ ...answers, [field.id]: event.target.value });
                  }}
                />
              ) : null}
              {field.kind === "short_text" || field.kind === "date" ? (
                <Input
                  className="mt-1 w-full"
                  type={field.kind === "date" ? "date" : "text"}
                  value={stringAnswer(answers[field.id])}
                  onChange={(event) => {
                    setSent(false);
                    setAnswers({ ...answers, [field.id]: event.target.value });
                  }}
                />
              ) : null}
              {field.kind === "yes_no" ? (
                <span className="mt-2 flex gap-4 text-[14px] font-semibold text-[var(--ink)]">
                  {([
                    ["yes", true],
                    ["no", false],
                  ] as const).map(([label, value]) => (
                    <label key={label} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={field.id}
                        checked={answers[field.id] === value}
                        onChange={() => {
                          setSent(false);
                          setAnswers({ ...answers, [field.id]: value });
                        }}
                      />
                      {label === "yes" ? "Yes" : "No"}
                    </label>
                  ))}
                </span>
              ) : null}
              {field.kind === "choice" ? (
                <Select
                  wrapperClassName="mt-1 block w-full"
                  value={stringAnswer(answers[field.id])}
                  onChange={(event) => {
                    setSent(false);
                    setAnswers({ ...answers, [field.id]: event.target.value });
                  }}
                >
                  <option value="">Choose</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : null}
            </label>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? "Sending…" : "Submit"}
            </Button>
            {sent ? (
              <p className="text-[13px] font-bold text-[var(--green-deep)]">Response sent.</p>
            ) : null}
          </div>
          {error ? <p className="text-[13px] font-bold text-[var(--ink)]">{error}</p> : null}
          <p className="text-[13px] text-[var(--ink-soft)]">
            Staff who can edit this form can read every response. You can send more than one.
          </p>
        </form>
      )}

      <section>
        <h2
          className="text-[18px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {canEdit ? "Responses" : "Your responses"}
        </h2>
        {submissionsQuery.isLoading ? (
          <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading responses…</p>
        ) : visibleSubmissions.length === 0 ? (
          <p className="mt-3 text-[14px] text-[var(--ink-soft)]">No responses yet.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {visibleSubmissions.map((row) => (
              <li
                key={row.id}
                className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
              >
                <p className="text-[13px] font-bold text-[var(--ink)]">
                  {row.submitterName || "Member"}
                  {row.subjectStudentName ? ` · ${row.subjectStudentName}` : ""}
                  <span className="ml-2 font-semibold text-[var(--ink-soft)]">
                    {new Date(row.submittedAt).toLocaleString()}
                  </span>
                </p>
                <dl className="mt-2 space-y-1">
                  {form.schema.fields.map((field) => (
                    <div key={field.id}>
                      <dt className="text-[12px] font-bold text-[var(--ink-soft)]">{field.label}</dt>
                      <dd className="text-[14px] text-[var(--ink)]">
                        {formatFormAnswer(field, row.payload[field.id])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
