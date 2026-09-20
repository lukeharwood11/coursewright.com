import assert from "node:assert/strict";
import { test } from "node:test";
import zlib from "node:zlib";
import React from "react";
import { pdf } from "@react-pdf/renderer";
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

function pageTexts(raw: string): string[] {
  const pages: string[] = [];
  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let out = "";
    try {
      out = zlib.inflateSync(Buffer.from(match[1], "latin1")).toString("latin1");
    } catch {
      continue;
    }
    const text = [...out.matchAll(/<([0-9a-fA-F]+)>/g)]
      .map((piece) => Buffer.from(piece[1], "hex").toString("latin1"))
      .join("");
    if (text.includes("Course Wright")) pages.push(text);
  }
  return pages;
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
