import assert from "node:assert/strict";
import { test } from "node:test";
import type { FolderAclSource } from "@/resources/model/access.ts";
import {
  buildLessonPlanResourcePicker,
  familyAccessWarningForDayResource,
  filterPickerNodes,
  lessonPlanDayResourceInserts,
  lessonPlanDayResourcesFromEmbeds,
  toggleDayResource,
} from "./dayResources.ts";

const unpublished = "Unpublished — families can’t open this resource.";
const neither = "Not shared with parents or students in Resources.";
const parentsOnlyMissing = "Not shared with parents in Resources.";
const studentsOnlyMissing = "Not shared with students in Resources.";
const unverified = "Access settings could not be verified.";

test("lesson plan resource warnings match the course page strings", () => {
  const folders = new Map<number, FolderAclSource>([
    [
      1,
      {
        id: 1,
        parentId: null,
        parentsCanView: false,
        studentsCanView: true,
        aclInherit: false,
      },
    ],
  ]);
  assert.equal(
    familyAccessWarningForDayResource({
      kind: "item",
      id: 9,
      visibility: "unpublished",
      parentFolderId: 1,
      parentsCanView: true,
      studentsCanView: true,
      aclInherit: false,
      foldersById: folders,
    }),
    unpublished,
  );
  assert.equal(
    familyAccessWarningForDayResource({
      kind: "folder",
      id: 1,
      visibility: null,
      parentFolderId: null,
      parentsCanView: false,
      studentsCanView: false,
      aclInherit: false,
      foldersById: folders,
    }),
    neither,
  );
  assert.equal(
    familyAccessWarningForDayResource({
      kind: "item",
      id: 9,
      visibility: "published",
      parentFolderId: 1,
      parentsCanView: true,
      studentsCanView: true,
      aclInherit: true,
      foldersById: folders,
    }),
    parentsOnlyMissing,
  );
  assert.equal(
    familyAccessWarningForDayResource({
      kind: "folder",
      id: 2,
      visibility: null,
      parentFolderId: 1,
      parentsCanView: true,
      studentsCanView: false,
      aclInherit: false,
      foldersById: folders,
    }),
    studentsOnlyMissing,
  );
  assert.equal(
    familyAccessWarningForDayResource({
      kind: "folder",
      id: 3,
      visibility: null,
      parentFolderId: 99,
      parentsCanView: true,
      studentsCanView: true,
      aclInherit: true,
      foldersById: folders,
    }),
    unverified,
  );
});

test("resource embeds keep order and drop rows RLS hid", () => {
  const folders = new Map<number, FolderAclSource>();
  const mapped = lessonPlanDayResourcesFromEmbeds(
    [
      {
        position: 2,
        folder_id: null,
        item_id: 9,
        folder: null,
        item: {
          id: 9,
          title: "Lab guide",
          type: "document",
          visibility: "published",
          folder_id: null,
          archived_at: null,
          parents_can_view: true,
          students_can_view: true,
          acl_inherit: false,
        },
      },
      {
        position: 0,
        folder_id: 4,
        item_id: null,
        folder: null,
        item: null,
      },
      {
        position: 1,
        folder_id: 3,
        item_id: null,
        folder: {
          id: 3,
          name: "Handouts",
          parent_id: null,
          archived_at: null,
          parents_can_view: true,
          students_can_view: true,
          acl_inherit: false,
        },
        item: null,
      },
    ],
    folders,
  );
  assert.deepEqual(
    mapped.map((resource) => ({ kind: resource.kind, id: resource.id, title: resource.title })),
    [
      { kind: "folder", id: 3, title: "Handouts" },
      { kind: "item", id: 9, title: "Lab guide" },
    ],
  );
});

test("save rows keep picker order for a folder then an item", () => {
  assert.deepEqual(
    lessonPlanDayResourceInserts(20, [
      { kind: "folder", id: 3 },
      { kind: "item", id: 9 },
    ]),
    [
      { lesson_plan_day_id: 20, folder_id: 3, item_id: null, position: 0 },
      { lesson_plan_day_id: 20, folder_id: null, item_id: 9, position: 1 },
    ],
  );
});

test("toggleDayResource appends and removes without mixing folder and item ids", () => {
  const once = toggleDayResource([], { kind: "folder", id: 1 });
  const both = toggleDayResource(once, { kind: "item", id: 1 });
  assert.deepEqual(both, [
    { kind: "folder", id: 1 },
    { kind: "item", id: 1 },
  ]);
  assert.deepEqual(toggleDayResource(both, { kind: "folder", id: 1 }), [
    { kind: "item", id: 1 },
  ]);
});

test("picker is course links plus descendants, and search stays in that set", () => {
  const foldersById = new Map([
    [
      1,
      {
        id: 1,
        parentId: null,
        name: "Handouts",
        parentsCanView: true,
        studentsCanView: true,
        aclInherit: false,
      },
    ],
    [
      2,
      {
        id: 2,
        parentId: 1,
        name: "Week 1",
        parentsCanView: true,
        studentsCanView: true,
        aclInherit: true,
      },
    ],
    [
      9,
      {
        id: 9,
        parentId: null,
        name: "Other",
        parentsCanView: true,
        studentsCanView: true,
        aclInherit: false,
      },
    ],
  ]);
  const nodes = buildLessonPlanResourcePicker({
    links: [
      {
        folderId: 1,
        itemId: null,
        title: "Handouts",
        kind: "folder",
        familyAccessWarning: null,
      },
      {
        folderId: null,
        itemId: 40,
        title: "Syllabus",
        kind: "document",
        familyAccessWarning: null,
      },
    ],
    foldersById,
    childFoldersByParent: new Map([
      [
        1,
        [
          {
            id: 2,
            parentId: 1,
            name: "Week 1",
            parentsCanView: true,
            studentsCanView: true,
            aclInherit: true,
          },
        ],
      ],
    ]),
    itemsByFolder: new Map([
      [
        2,
        [
          {
            id: 7,
            folderId: 2,
            title: "Nested sheet",
            type: "document",
            visibility: "published",
            parentsCanView: true,
            studentsCanView: true,
            aclInherit: true,
          },
        ],
      ],
    ]),
  });
  const titles = nodes.flatMap((node) => [
    node.title,
    ...node.children.flatMap((child) => [child.title, ...child.children.map((nested) => nested.title)]),
  ]);
  assert.deepEqual(titles, ["Handouts", "Week 1", "Nested sheet", "Syllabus"]);
  assert.equal(titles.includes("Other"), false);
  const matches = filterPickerNodes(nodes, "week");
  assert.deepEqual(
    matches.map((node) => node.title),
    ["Week 1", "Nested sheet"],
  );
  assert.deepEqual(filterPickerNodes(nodes, "other"), []);
});
