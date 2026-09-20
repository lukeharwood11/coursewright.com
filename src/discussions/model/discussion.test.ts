import assert from "node:assert/strict";
import { test } from "node:test";
import {
  discussionAudienceLabel,
  discussionFilterLabel,
  discussionStatusLabel,
  discussionTargetName,
  parseDiscussionAudience,
  parseDiscussionFilter,
} from "./audience.ts";
import { newDiscussionPath, discussionPath, discussionMessagePath, discussionsPath } from "./paths.ts";
import { isNearScrollBottom } from "./thread.ts";
import {
  buildDiscussionQuote,
  lexicalStateWithQuote,
  parseDiscussionBody,
  serializeDiscussionBody,
} from "./messageBody.ts";
import {
  countUnreadDiscussions,
  filterDiscussions,
  forStudentsLabel,
  isDiscussionUnread,
  sortDiscussionsForList,
  studentsForDiscussion,
  visibleDiscussions,
} from "./unread.ts";
import {
  canEditMessage,
  canMarkDiscussionAnswered,
  canRemoveDiscussion,
  canRemoveMessage,
  discussionDraftCanStart,
  draftFromSearchParams,
  isHttpUrl,
  messageHasContent,
  validateDiscussionDraft,
  validatePost,
  validateUrlAttachment,
} from "./validate.ts";

test("parseDiscussionAudience accepts course or class only", () => {
  assert.equal(parseDiscussionAudience("course"), "course");
  assert.equal(parseDiscussionAudience("class"), "class");
  assert.equal(parseDiscussionAudience("student"), null);
});

test("discussion labels use product words", () => {
  assert.equal(discussionAudienceLabel("course"), "Course");
  assert.equal(discussionAudienceLabel("class"), "Class");
  assert.equal(discussionStatusLabel(null), "Open");
  assert.equal(discussionStatusLabel("2026-01-01T00:00:00Z"), "Resolved");
  assert.equal(discussionFilterLabel("all"), "All");
  assert.equal(discussionFilterLabel("open"), "Open");
  assert.equal(discussionFilterLabel("answered"), "Resolved");
  assert.equal(parseDiscussionFilter("open"), "open");
  assert.equal(parseDiscussionFilter("nope"), "all");
});

test("discussionTargetName uses the matching audience title", () => {
  assert.equal(
    discussionTargetName({
      audience: "course",
      courseTitle: "Biology",
      classTitle: "Wednesday",
    }),
    "Biology",
  );
  assert.equal(
    discussionTargetName({
      audience: "class",
      courseTitle: "Biology",
      classTitle: "Wednesday",
    }),
    "Wednesday",
  );
});

test("discussion paths nest under the org", () => {
  assert.equal(discussionsPath("coop"), "/my/coop/discussions");
  assert.equal(discussionPath("coop", 9), "/my/coop/discussions/9");
  assert.equal(
    discussionMessagePath("coop", 9, 42),
    "/my/coop/discussions/9#message-42",
  );
  assert.equal(
    newDiscussionPath("coop", { audience: "course", courseId: 3 }),
    "/my/coop/discussions/new?audience=course&courseId=3",
  );
  assert.equal(
    newDiscussionPath("coop", { audience: "class", classId: 4 }),
    "/my/coop/discussions/new?audience=class&classId=4",
  );
});

test("draftFromSearchParams prefills one audience target", () => {
  const course = draftFromSearchParams(
    new URLSearchParams("audience=course&courseId=12"),
  );
  assert.deepEqual(course, { audience: "course", courseId: 12, classId: null });
  const klass = draftFromSearchParams(
    new URLSearchParams("audience=class&classId=8"),
  );
  assert.deepEqual(klass, { audience: "class", courseId: null, classId: 8 });
});

test("unread is missing last_read_at or activity after it", () => {
  assert.equal(
    isDiscussionUnread({ lastMessageAt: "2026-01-02T00:00:00Z", lastReadAt: null }),
    true,
  );
  assert.equal(
    isDiscussionUnread({
      lastMessageAt: "2026-01-02T00:00:00Z",
      lastReadAt: "2026-01-01T00:00:00Z",
    }),
    true,
  );
  assert.equal(
    isDiscussionUnread({
      lastMessageAt: "2026-01-02T00:00:00Z",
      lastReadAt: "2026-01-02T00:00:00Z",
    }),
    false,
  );
});

test("list hides empty threads, unread first, then newest activity", () => {
  const rows = [
    {
      id: 1,
      lastMessageAt: "2026-01-03T00:00:00Z",
      lastReadAt: "2026-01-04T00:00:00Z",
      answeredAt: null,
      hasVisibleMessages: true,
    },
    {
      id: 2,
      lastMessageAt: "2026-01-02T00:00:00Z",
      lastReadAt: null,
      answeredAt: "2026-01-02T00:00:00Z",
      hasVisibleMessages: true,
    },
    {
      id: 3,
      lastMessageAt: "2026-01-05T00:00:00Z",
      lastReadAt: "2026-01-01T00:00:00Z",
      answeredAt: null,
      hasVisibleMessages: true,
    },
    {
      id: 4,
      lastMessageAt: "2026-01-09T00:00:00Z",
      lastReadAt: null,
      answeredAt: null,
      hasVisibleMessages: false,
    },
  ];
  const visible = visibleDiscussions(rows);
  assert.deepEqual(
    visible.map((row) => row.id),
    [1, 2, 3],
  );
  assert.deepEqual(
    sortDiscussionsForList(visible).map((row) => row.id),
    [3, 2, 1],
  );
  assert.deepEqual(
    filterDiscussions(visible, "open").map((row) => row.id),
    [1, 3],
  );
  assert.deepEqual(
    filterDiscussions(visible, "answered").map((row) => row.id),
    [2],
  );
  assert.equal(countUnreadDiscussions(rows), 2);
});

test("studentsForDiscussion matches enrollments or class members", () => {
  const students = [
    { id: 1, name: "Maya" },
    { id: 2, name: "Owen" },
  ];
  assert.deepEqual(
    studentsForDiscussion({
      audience: "course",
      courseId: 10,
      classId: null,
      students,
      enrollments: [
        { studentId: 2, courseId: 10 },
        { studentId: 1, courseId: 11 },
      ],
      classMembers: [],
    }).map((row) => row.name),
    ["Owen"],
  );
  assert.deepEqual(
    studentsForDiscussion({
      audience: "class",
      courseId: null,
      classId: 5,
      students,
      enrollments: [],
      classMembers: [
        { studentId: 1, classId: 5 },
        { studentId: 2, classId: 9 },
      ],
    }).map((row) => row.name),
    ["Maya"],
  );
  assert.equal(forStudentsLabel([{ name: "Maya" }]), "For Maya");
  assert.equal(
    forStudentsLabel([{ name: "Maya" }, { name: "Owen" }]),
    "For Maya and Owen",
  );
});

test("opening post needs a title, one audience, and content", () => {
  const base = {
    audience: "course" as const,
    courseId: 1,
    classId: null,
    title: "Field trip?",
    body: "",
  };
  assert.equal(
    validateDiscussionDraft(base, []),
    "Write a first post, or add a file, material, or link.",
  );
  assert.equal(discussionDraftCanStart({ ...base, body: "Can we go?" }, []), true);
  assert.equal(
    discussionDraftCanStart(base, [{ kind: "file", label: "map.pdf" }]),
    true,
  );
  assert.equal(
    validateDiscussionDraft({ ...base, title: "" }, [{ kind: "file", label: "a" }]),
    "Add a title so people know what this is about.",
  );
  assert.equal(
    validateDiscussionDraft({ ...base, audience: null, title: "Hi", body: "x" }, []),
    "Choose a course or a class.",
  );
});

test("url attachments must be http(s)", () => {
  assert.equal(isHttpUrl("https://example.com/a"), true);
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
  assert.equal(validateUrlAttachment("not a url"), "Use a web address that starts with http:// or https://.");
  assert.equal(
    validatePost(
      { v: 1, format: "plain", text: "" },
      [{ kind: "url", url: "https://example.com", label: "" }],
    ),
    null,
  );
  assert.equal(
    validatePost({ v: 1, format: "plain", text: "" }, []),
    "Write a message, or add a file, material, or link.",
  );
  assert.equal(messageHasContent("  ", []), false);
});

test("starter or staff can mark answered; staff Teacher view removes a thread", () => {
  assert.equal(
    canMarkDiscussionAnswered({ userId: "a", createdBy: "a", isStaff: false }),
    true,
  );
  assert.equal(
    canMarkDiscussionAnswered({ userId: "a", createdBy: "b", isStaff: true }),
    true,
  );
  assert.equal(
    canMarkDiscussionAnswered({ userId: "a", createdBy: "b", isStaff: false }),
    false,
  );
  assert.equal(canRemoveDiscussion(true), true);
  assert.equal(canRemoveDiscussion(false), false);
  assert.equal(
    canRemoveMessage({ userId: "a", authorId: "a", isStaffTeacherView: false }),
    true,
  );
  assert.equal(
    canRemoveMessage({ userId: "a", authorId: "b", isStaffTeacherView: false }),
    false,
  );
  assert.equal(
    canRemoveMessage({ userId: "a", authorId: "b", isStaffTeacherView: true }),
    true,
  );
  assert.equal(
    canEditMessage({ userId: "a", authorId: "a", deletedAt: null }),
    true,
  );
  assert.equal(
    canEditMessage({ userId: "a", authorId: "b", deletedAt: null }),
    false,
  );
  assert.equal(
    canEditMessage({
      userId: "a",
      authorId: "a",
      deletedAt: "2026-01-01T00:00:00Z",
    }),
    false,
  );
});

test("discussion body keeps plain text and folds quotes into Lexical", () => {
  assert.deepEqual(parseDiscussionBody("Hello"), {
    v: 1,
    format: "plain",
    text: "Hello",
  });
  const legacy = {
    v: 1,
    format: "plain",
    text: "Thanks",
    quote: { authorName: "Maya", text: "Can we go?" },
  };
  const folded = parseDiscussionBody(JSON.stringify(legacy));
  assert.equal(folded.format, "lexical");
  if (folded.format === "lexical") {
    const root = folded.lexical.root as { children?: Array<{ type?: string }> };
    assert.equal(root.children?.[0]?.type, "quote");
  }
  const built = lexicalStateWithQuote({
    quote: { authorName: "Maya", text: "Can we go?" },
    followingText: "Thanks",
  });
  assert.equal(
    serializeDiscussionBody({ v: 1, format: "lexical", lexical: built }),
    JSON.stringify({ v: 1, format: "lexical", lexical: built }),
  );
  assert.deepEqual(
    buildDiscussionQuote({
      authorName: "Maya",
      body: "Field trip next week?",
      hasAttachments: false,
    }),
    { authorName: "Maya", text: "Field trip next week?" },
  );
});

test("isNearScrollBottom uses a small threshold", () => {
  assert.equal(isNearScrollBottom(920, 1000, 80, 80), true);
  assert.equal(isNearScrollBottom(100, 1000, 80, 80), false);
});
