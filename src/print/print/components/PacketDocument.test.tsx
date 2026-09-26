import assert from "node:assert/strict";
import { test } from "node:test";
import zlib from "node:zlib";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { presentCourseQuizPrint, type CourseQuizPrintSource } from "../../../quizzes/model/print.ts";
import type { PrintPacket } from "../../model/packet.ts";
import { renderPrintPdf } from "../hooks/renderPrintPdf.tsx";
import { PacketDocument } from "./PacketDocument.tsx";
import type { PrintMaterialView, PrintPacketView } from "../../model/previewAssets.ts";

function pageMaterial(
  overrides: Partial<PrintMaterialView> & Pick<PrintMaterialView, "id" | "title">,
): PrintMaterialView {
  return {
    description: "",
    kind: "page",
    url: null,
    scheduledDate: null,
    blocks: [{ kind: "rich_text", body: { markdown: "A short worksheet." } }],
    file: null,
    qrDataUrl: null,
    imageSrc: null,
    videoQrs: [],
    ...overrides,
  };
}

function packet(materials: PrintMaterialView[]): PrintPacketView {
  return {
    title: "This week",
    subtitle: "Week of Sep 13 – Sep 19",
    includeAnswerKey: false,
    materials,
  };
}

function inflatedStreams(raw: string): string[] {
  const streams: string[] = [];
  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    try {
      streams.push(zlib.inflateSync(Buffer.from(match[1], "latin1")).toString("latin1"));
    } catch {
      continue;
    }
  }
  return streams;
}

function streamText(stream: string): string {
  return [...stream.matchAll(/<([0-9a-fA-F]+)>/g)]
    .map((piece) => Buffer.from(piece[1], "hex").toString("latin1"))
    .join("");
}

function pageTexts(raw: string): string[] {
  return inflatedStreams(raw)
    .map(streamText)
    .filter((text) => text.includes("Course Wright"));
}

function pdfText(raw: string): string {
  return inflatedStreams(raw).map(streamText).join("\n");
}

/** Widest horizontal rule that is not the page background. */
function widestContentRule(raw: string): number {
  let widest = 0;
  for (const stream of inflatedStreams(raw)) {
    for (const match of stream.matchAll(/([\d.]+) ([\d.]+) m\s+0 \2 l/g)) {
      const width = Number(match[1]);
      if (width > widest && width < 600) widest = width;
    }
  }
  return widest;
}

async function renderPages(view: PrintPacketView): Promise<string[]> {
  const blob = await pdf(<PacketDocument packet={view} />).toBlob();
  const raw = Buffer.from(await blob.arrayBuffer()).toString("latin1");
  return pageTexts(raw);
}

test("this-week PDF prints one student at a time and packs short work", async () => {
  const pages = await renderPages(
    packet([
      pageMaterial({
        id: 100,
        title: "Weekly Bulletin",
        sectionKey: "student-1",
        sectionTitle: "Emma Caldwell",
        contextLines: ["Weekly Bulletin · Important now"],
      }),
      pageMaterial({
        id: 101,
        title: "Leaf collection",
        sectionKey: "student-1",
        sectionTitle: "Emma Caldwell",
        contextLines: ["Science"],
      }),
      pageMaterial({
        id: 100,
        title: "Weekly Bulletin",
        sectionKey: "student-2",
        sectionTitle: "Noah Caldwell",
        contextLines: ["Weekly Bulletin · Important now"],
      }),
    ]),
  );

  assert.equal(pages.length, 2);
  assert.match(pages[0] ?? "", /Emma Caldwell/);
  assert.match(pages[0] ?? "", /Leaf collection/);
  assert.doesNotMatch(pages[0] ?? "", /Noah Caldwell/);
  assert.match(pages[1] ?? "", /Noah Caldwell/);
  assert.doesNotMatch(pages[1] ?? "", /Emma Caldwell/);
  assert.doesNotMatch(pages[1] ?? "", /Leaf collection/);
});

test("unit packets still page-break between materials", async () => {
  const pages = await renderPages(
    packet([
      pageMaterial({ id: 1, title: "Lesson one" }),
      pageMaterial({ id: 2, title: "Lesson two" }),
    ]),
  );
  assert.equal(pages.length, 2);
  assert.match(pages[0] ?? "", /Lesson one/);
  assert.doesNotMatch(pages[0] ?? "", /Lesson two/);
  assert.match(pages[1] ?? "", /Lesson two/);
});

const quizSources: CourseQuizPrintSource[] = [
  {
    id: 1,
    prompt: "Which is even?",
    points: 1,
    kind: "multiple_choice",
    choices: [
      { id: "1", text: "Red", correct: false },
      { id: "2", text: "4", correct: true },
    ],
    answer: "",
    answerLines: null,
    prompts: [],
    options: [],
    matchKeys: [],
  },
  {
    id: 2,
    prompt: "Match the pairs",
    points: 1,
    kind: "matching",
    choices: [],
    answer: "",
    answerLines: null,
    prompts: [
      { id: 11, position: 0, text: "1" },
      { id: 12, position: 1, text: "5" },
      { id: 13, position: 2, text: "7" },
    ],
    options: [
      { id: 21, position: 0, text: "2" },
      { id: 22, position: 1, text: "6" },
      { id: 23, position: 2, text: "8" },
    ],
    matchKeys: [
      { promptId: 11, optionId: 21 },
      { promptId: 12, optionId: 22 },
      { promptId: 13, optionId: 23 },
    ],
  },
  {
    id: 3,
    prompt: "Name the river",
    points: 1,
    kind: "short_answer",
    choices: [],
    answer: "Brookfield",
    answerLines: null,
    prompts: [],
    options: [],
    matchKeys: [],
  },
  {
    id: 4,
    prompt: "Explain why",
    points: 2,
    kind: "long_answer",
    choices: [],
    answer: "It carries the runoff",
    answerLines: 3,
    prompts: [],
    options: [],
    matchKeys: [],
  },
];

function quizPacket(mode: "key" | "worksheet"): PrintPacket {
  const showKey = mode === "key";
  const questions = quizSources.map((question) => presentCourseQuizPrint(question, showKey));
  return {
    title: "Pairs quiz",
    subtitle: null,
    courseTitle: "Life science",
    includeAnswerKey: false,
    materials: [],
    quizKeyMode: mode,
    quizQuestions: questions,
    quizQuestionsKey: showKey ? questions : undefined,
  };
}

test("quiz answer key lists checks, pairs, and written answers", async () => {
  const pdf = await renderPrintPdf(quizPacket("key"));
  const text = pdfText(Buffer.from(pdf.bytes).toString("latin1"));
  assert.match(text, /Life science/);
  assert.match(text, /1\. Which is even\? \(1 point\)/);
  assert.match(text, /2\. Match the pairs \(1 point\)/);
  assert.match(text, /Correct: B/);
  assert.match(text, /125678/);
  assert.doesNotMatch(text, /=>/);
  assert.doesNotMatch(text, /A\. 6/);
  assert.doesNotMatch(text, /Date/);
  assert.match(text, /Answer: Brookfield/);
  assert.match(text, /Answer: It carries the runoff/);
});

test("long-answer worksheet rules span the page", async () => {
  const pdf = await renderPrintPdf(quizPacket("worksheet"));
  const raw = Buffer.from(pdf.bytes).toString("latin1");
  const text = pdfText(raw);
  assert.match(text, /Life science/);
  assert.match(text, /Explain why/);
  assert.match(text, /Name/);
  assert.match(text, /Date/);
  assert.doesNotMatch(text, /It carries the runoff/);
  assert.doesNotMatch(text, /Brookfield/);
  assert.doesNotMatch(text, /Answer key/);
  const width = widestContentRule(raw);
  assert.ok(
    width > 480 && width < 530,
    `expected a rule across the text column, widest was ${width}`,
  );
});
