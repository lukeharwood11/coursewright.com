import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COURSE_LIST_PAGE_SIZE,
  clampCourseListPage,
  courseListPageCount,
  courseListRangeLabel,
  courseMatchesFilters,
  filterCourses,
  paginateCourses,
  uniqueCourseSubjects,
} from "./courseListFilters.ts";

const sample = [
  {
    title: "Algebra I",
    description: "Linear equations",
    location: "Room 12",
    subject: "Math",
    gradeLevels: ["8", "9"],
  },
  {
    title: "World History",
    description: "Ancient to modern",
    location: "Hall B",
    subject: "History",
    gradeLevels: ["9"],
  },
  {
    title: "Art Studio",
    description: "",
    location: "",
    subject: "Art",
    gradeLevels: [],
  },
];

test("courseMatchesFilters searches title description location subject grades", () => {
  assert.equal(
    courseMatchesFilters(sample[0], { query: "algebra", subject: "", grades: [] }),
    true,
  );
  assert.equal(
    courseMatchesFilters(sample[0], { query: "room 12", subject: "", grades: [] }),
    true,
  );
  assert.equal(
    courseMatchesFilters(sample[1], { query: "ancient", subject: "", grades: [] }),
    true,
  );
  assert.equal(
    courseMatchesFilters(sample[0], { query: "history", subject: "", grades: [] }),
    false,
  );
});

test("courseMatchesFilters requires subject and any selected grade", () => {
  assert.equal(
    courseMatchesFilters(sample[0], { query: "", subject: "Math", grades: [] }),
    true,
  );
  assert.equal(
    courseMatchesFilters(sample[0], { query: "", subject: "History", grades: [] }),
    false,
  );
  assert.equal(
    courseMatchesFilters(sample[0], { query: "", subject: "", grades: ["8"] }),
    true,
  );
  assert.equal(
    courseMatchesFilters(sample[0], { query: "", subject: "", grades: ["9"] }),
    true,
  );
  assert.equal(
    courseMatchesFilters(sample[0], { query: "", subject: "", grades: ["10"] }),
    false,
  );
  assert.equal(
    courseMatchesFilters(sample[2], { query: "", subject: "", grades: ["9"] }),
    false,
  );
});

test("filterCourses and uniqueCourseSubjects", () => {
  assert.equal(
    filterCourses(sample, { query: "", subject: "Math", grades: [] }).length,
    1,
  );
  assert.deepEqual(uniqueCourseSubjects(sample), ["Art", "History", "Math"]);
  assert.deepEqual(uniqueCourseSubjects([{ subject: "  " }, { subject: "Math" }]), [
    "Math",
  ]);
});

test("pagination helpers", () => {
  assert.equal(COURSE_LIST_PAGE_SIZE, 12);
  assert.equal(courseListPageCount(0), 1);
  assert.equal(courseListPageCount(12), 1);
  assert.equal(courseListPageCount(13), 2);
  assert.equal(clampCourseListPage(0, 25), 1);
  assert.equal(clampCourseListPage(99, 25), 3);
  assert.deepEqual(
    paginateCourses([1, 2, 3, 4, 5], 2, 2),
    [3, 4],
  );
  assert.equal(courseListRangeLabel(0, 1), "0 courses");
  assert.equal(courseListRangeLabel(1, 1), "1 course");
  assert.equal(courseListRangeLabel(25, 2), "13–24 of 25");
});
