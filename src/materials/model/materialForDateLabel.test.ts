import assert from "node:assert/strict";
import test from "node:test";
import { normalizeHomeDays } from "@/organizations/model/homeDays";
import {
  materialFocusDayFieldLabel,
  materialForDateLabel,
} from "./materialForDateLabel";

test("focus day labels use home before school when both apply", () => {
  const homeDays = normalizeHomeDays([1]);
  const schoolDays = [1, 2, 3, 4, 5];
  const iso = "2026-09-14";
  assert.equal(
    materialFocusDayFieldLabel(iso, schoolDays, homeDays),
    "Focus Day (Home)",
  );
  assert.equal(materialForDateLabel(iso, schoolDays, homeDays), "Focus Day (Home)");
});

test("focus day labels use school on school-only weekdays", () => {
  const iso = "2026-09-15";
  assert.equal(
    materialFocusDayFieldLabel(iso, [1, 2, 3, 4, 5], []),
    "Focus Day (School)",
  );
  assert.equal(
    materialForDateLabel(iso, [1, 2, 3, 4, 5], []),
    "Focus Day (School)",
  );
});

test("focus day label omits kind when the day matches neither", () => {
  assert.equal(
    materialFocusDayFieldLabel("2026-09-13", [1, 2, 3, 4, 5], []),
    "Focus Day",
  );
});

test("focus day field label before a date is chosen", () => {
  assert.equal(materialFocusDayFieldLabel("", [1, 2, 3, 4, 5], []), "Focus Day");
});
