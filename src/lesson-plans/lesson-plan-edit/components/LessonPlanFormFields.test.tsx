import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { visibleDaysForWeek } from "../../model/validate.ts";
import { LessonPlanFormFields } from "./LessonPlanFormFields.tsx";

test("lesson plan form wraps day cards instead of seven columns", () => {
  const html = renderToStaticMarkup(
    <LessonPlanFormFields
      title="This week in Science"
      weekNote=""
      weekStart="2026-09-13"
      days={visibleDaysForWeek("2026-09-13")}
      materials={[]}
      units={[]}
      onTitle={() => undefined}
      onWeekNote={() => undefined}
      onWeekStart={() => undefined}
      onDayBody={() => undefined}
      onToggleMaterial={() => undefined}
      onAddDay={() => undefined}
    />,
  );
  assert.match(html, /auto-fill,minmax\(min\(100%,18rem\),1fr\)/);
  assert.equal(html.includes("md:grid-cols-7"), false);
  assert.equal([...html.matchAll(/<section/g)].length, 5);
  assert.match(html, /Add another day/);
  assert.match(html, /Link materials/);
  assert.equal(html.includes("<select"), false);
  assert.equal(html.includes('type="checkbox"'), false);
});
