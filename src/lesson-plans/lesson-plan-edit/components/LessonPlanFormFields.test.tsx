import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { visibleDaysForWeek } from "../../model/validate.ts";
import { LessonPlanFormFields } from "./LessonPlanFormFields.tsx";
import { LessonPlanMaterialPicker } from "./LinkMaterialsModal.tsx";
import { LessonPlanResourcePicker } from "./LinkResourcesModal.tsx";

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
      onToggleResource={() => undefined}
      resourceCatalog={[]}
      resourceNodes={[]}
      courseHasResourceLinks={false}
      resourcesLoading={false}
      onAddDay={() => undefined}
      dayPreset="school"
      onDayPreset={() => undefined}
    />,
  );
  assert.match(html, /auto-fill,minmax\(min\(100%,18rem\),1fr\)/);
  assert.equal(html.includes("md:grid-cols-7"), false);
  assert.equal([...html.matchAll(/<section/g)].length, 5);
  assert.match(html, /Add another day/);
  assert.match(html, /Link content/);
  assert.equal(html.includes("Link materials"), false);
  assert.equal(html.includes("Link resources"), false);
  assert.equal(html.includes("LinkResourceDialog"), false);
  assert.match(html, /School days/);
  assert.match(html, /Home days/);
  assert.match(html, /Weekdays/);
  assert.equal(html.includes("<select"), false);
  assert.equal(html.includes('type="checkbox"'), false);
});

test("link content popup switches between materials and course-linked resources", () => {
  const materials = renderToStaticMarkup(
    <LessonPlanMaterialPicker
      materials={[]}
      units={[]}
      selectedIds={[1]}
      onToggle={() => undefined}
    />,
  );
  assert.match(materials, /Add materials to this course first/);

  const linkedMaterial = renderToStaticMarkup(
    <LessonPlanMaterialPicker
      materials={[
        {
          id: 1,
          title: "Lab packet",
          description: "",
          kind: "page",
          unitId: null,
          visibility: "published",
          status: "active",
          organizationId: 1,
          courseId: 1,
          scheduledDate: null,
          dueDate: null,
          workType: "material",
          fileId: null,
          url: null,
          deletedAt: null,
        } as never,
      ]}
      units={[]}
      selectedIds={[1]}
      onToggle={() => undefined}
    />,
  );
  assert.match(linkedMaterial, /Lab packet/);
  assert.match(linkedMaterial, /Linked/);

  const resources = renderToStaticMarkup(
    <LessonPlanResourcePicker
      nodes={[]}
      selected={[]}
      courseHasLinks={false}
      loading={false}
      onToggle={() => undefined}
    />,
  );
  assert.match(resources, /Link a resource on this course first\./);
});
