import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { formatFormAnswer } from "@/resources/model/formSchema";
import type { FormFillModel } from "../hooks/useFormFill";

const labelClass = "block text-[13px] font-bold text-[var(--ink-soft)]";

export function FormFillView({ fill }: { fill: FormFillModel }) {
  if (fill.loading) {
    return <p className="mt-4 text-[14px] text-[var(--ink-soft)]">Loading form…</p>;
  }
  if (fill.missing || !fill.schema) {
    return (
      <p className="mt-4 text-[14px] text-[var(--ink-soft)]">This form isn’t ready yet.</p>
    );
  }

  const schema = fill.schema;

  return (
    <div className="mt-4 space-y-8">
      {!fill.published ? (
        <p className="text-[14px] text-[var(--ink-soft)]">
          Publish this form before anyone can respond. People who can open the published
          form can send a response. Editing the resource is not the same as course materials.
        </p>
      ) : (
        <form
          className="max-w-xl space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            fill.submit();
          }}
        >
          {schema.subject !== "none" ? (
            <label className={labelClass}>
              Student
              {schema.subject === "required" ? " (required)" : " (optional)"}
              <Select
                wrapperClassName="mt-1 block w-full"
                value={fill.studentId}
                onChange={(event) => fill.setStudentId(event.target.value)}
              >
                <option value="">
                  {schema.subject === "required" ? "Choose a student" : "No student"}
                </option>
                {fill.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          {schema.fields.length === 0 ? (
            <p className="text-[14px] text-[var(--ink-soft)]">This form has no questions yet.</p>
          ) : null}

          {schema.fields.map((field) => (
            <label key={field.id} className={labelClass}>
              {field.label}
              {field.required ? " (required)" : ""}
              {field.kind === "long_text" ? (
                <textarea
                  className="mt-1 min-h-28 w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]"
                  value={fill.textAnswer(field.id)}
                  onChange={(event) => fill.setTextAnswer(field.id, event.target.value)}
                />
              ) : null}
              {field.kind === "short_text" || field.kind === "date" ? (
                <Input
                  className="mt-1 w-full"
                  type={field.kind === "date" ? "date" : "text"}
                  value={fill.textAnswer(field.id)}
                  onChange={(event) => fill.setTextAnswer(field.id, event.target.value)}
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
                        checked={fill.yesNo(field.id) === value}
                        onChange={() => fill.setYesNo(field.id, value)}
                      />
                      {label === "yes" ? "Yes" : "No"}
                    </label>
                  ))}
                </span>
              ) : null}
              {field.kind === "choice" ? (
                <Select
                  wrapperClassName="mt-1 block w-full"
                  value={fill.textAnswer(field.id)}
                  onChange={(event) => fill.setTextAnswer(field.id, event.target.value)}
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
            <Button type="submit" disabled={fill.pending}>
              {fill.pending ? "Sending…" : "Submit"}
            </Button>
            {fill.sent ? (
              <p className="text-[13px] font-bold text-[var(--green-deep)]">Response sent.</p>
            ) : null}
          </div>
          {fill.error ? <p className="text-[13px] font-bold text-[var(--ink)]">{fill.error}</p> : null}
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
          {fill.canEdit ? "Responses" : "Your responses"}
        </h2>
        {fill.submissionsLoading ? (
          <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading responses…</p>
        ) : fill.submissions.length === 0 ? (
          <p className="mt-3 text-[14px] text-[var(--ink-soft)]">No responses yet.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {fill.submissions.map((row) => (
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
                  {schema.fields.map((field) => (
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
