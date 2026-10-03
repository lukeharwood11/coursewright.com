import assert from "node:assert/strict";
import { test } from "node:test";
import {
  blankFormField,
  emptyFormSchema,
  formAnswersPayload,
  normalizeFormSchema,
  parseFormSchema,
  validateFormAnswers,
  validateFormSchema,
} from "./formSchema.ts";

test("parseFormSchema drops invalid questions and unknown subject", () => {
  const schema = parseFormSchema({
    subject: "nope",
    fields: [
      { id: "ok", label: "Name", kind: "short_text", required: true },
      { id: "bad id", label: "X", kind: "short_text" },
      { id: "ok", label: "Dupe", kind: "date" },
      { id: "pick", label: "Color", kind: "choice", options: ["Red", 1] },
    ],
  });
  assert.equal(schema.subject, "none");
  assert.deepEqual(
    schema.fields.map((field) => field.id),
    ["ok", "pick"],
  );
  assert.deepEqual(schema.fields[1]?.options, ["Red"]);
  assert.deepEqual(parseFormSchema(null), emptyFormSchema());
});

test("validateFormSchema requires named questions and choice options", () => {
  const field = blankFormField();
  assert.equal(validateFormSchema({ subject: "none", fields: [field] }), "Name every question.");
  const choice = { ...field, label: "Color", kind: "choice" as const, options: ["Red", "Red"] };
  assert.match(
    validateFormSchema({ subject: "optional", fields: [choice] }) ?? "",
    /different/,
  );
  const ok = normalizeFormSchema({
    subject: "required",
    fields: [{ ...field, label: "  Color  ", kind: "choice", options: [" Red ", "Blue", ""] }],
  });
  assert.equal(validateFormSchema(ok), null);
  assert.deepEqual(ok.fields[0]?.options, ["Red", "Blue"]);
});

test("validateFormAnswers enforces required questions and student subject", () => {
  const schema = {
    subject: "required" as const,
    fields: [
      {
        id: "note",
        label: "Note",
        kind: "short_text" as const,
        required: true,
        options: [],
      },
      {
        id: "ok",
        label: "OK",
        kind: "yes_no" as const,
        required: false,
        options: [],
      },
    ],
  };
  assert.equal(
    validateFormAnswers({ schema, answers: { note: "Hi" }, subjectStudentId: null }),
    "Choose a student.",
  );
  assert.equal(
    validateFormAnswers({ schema, answers: { note: "  " }, subjectStudentId: 4 }),
    "Answer every required question.",
  );
  assert.equal(
    validateFormAnswers({
      schema,
      answers: { note: "Hi", ok: false, extra: "nope" },
      subjectStudentId: 4,
    }),
    null,
  );
  assert.deepEqual(formAnswersPayload(schema, { note: " Hi ", ok: false }), {
    note: "Hi",
    ok: false,
  });
});
