import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { CalendarLessonPlanDay } from "../model/events.ts";
import { WeekCalendar } from "./WeekCalendar.tsx";

test("This week cards keep each class’s materials with its text on the same day card", () => {
  const lessonDays: CalendarLessonPlanDay[] = [
    {
      planId: 1,
      courseId: 10,
      courseTitle: "Science",
      colorKey: "moss",
      date: "2026-09-15",
      body: "Lab day",
      unpublished: false,
      materials: [{ id: 1, title: "Lab write-up", unitId: null, assigned: false, due: false }],
    },
    {
      planId: 2,
      courseId: 11,
      courseTitle: "Art",
      colorKey: "clay",
      date: "2026-09-15",
      body: "Sketch hour",
      unpublished: false,
      materials: [{ id: 2, title: "Still life", unitId: null, assigned: false, due: false }],
    },
  ];
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <WeekCalendar
        orgSlug="demo"
        weekStart="2026-09-13"
        weekNotes={[]}
        lessonDays={lessonDays}
        chips={[]}
        hiddenCourseIds={new Set()}
        layout="cards"
      />
    </MemoryRouter>,
  );
  const sections = [...html.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)].map(
    (match) => match[1] ?? "",
  );
  assert.equal(sections.length, 1);
  const tuesday = sections[0] ?? "";
  assert.ok(tuesday.includes("Tuesday"));
  assert.ok(tuesday.includes("Science"));
  assert.ok(tuesday.includes("Lab day"));
  assert.ok(tuesday.includes("Lab write-up"));
  assert.ok(tuesday.includes("Art"));
  assert.ok(tuesday.includes("Sketch hour"));
  assert.ok(tuesday.includes("Still life"));
});
