import assert from "node:assert/strict";
import test from "node:test";
import { validateMaterialFields } from "./validate";
import {
  materialWorkTypeAllowsDueDate,
  materialWorkTypeAllowsSubmissions,
  materialWorkTypeLabel,
  parseMaterialWorkType,
} from "./workType";

test("work type labels and gates", () => {
  assert.equal(parseMaterialWorkType("assignment"), "assignment");
  assert.equal(parseMaterialWorkType("quiz"), null);
  assert.equal(materialWorkTypeLabel("material"), "Material");
  assert.equal(materialWorkTypeLabel("assignment"), "Assignment");
  assert.equal(materialWorkTypeAllowsDueDate("material"), false);
  assert.equal(materialWorkTypeAllowsDueDate("assignment"), true);
  assert.equal(materialWorkTypeAllowsSubmissions("material"), false);
  assert.equal(materialWorkTypeAllowsSubmissions("assignment"), true);
});

test("creating a material rejects a due date", () => {
  const parsed = validateMaterialFields({
    title: "Reading",
    description: "",
    kind: "page",
    workType: "material",
    url: "",
    scheduledDate: "2026-09-15",
    dueDate: "2026-09-16",
  });
  assert.equal(parsed.ok, false);
});

test("creating an assignment keeps the due date", () => {
  const parsed = validateMaterialFields({
    title: "Essay",
    description: "",
    kind: "page",
    workType: "assignment",
    url: "",
    scheduledDate: "",
    dueDate: "2026-09-16",
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.workType, "assignment");
  assert.equal(parsed.value.dueDate, "2026-09-16");
  assert.equal(parsed.value.scheduledDate, null);
});
