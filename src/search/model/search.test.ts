import assert from "node:assert/strict";
import { test } from "node:test";
import { filterPageResults, staffSearchPages } from "./pages";
import { searchResultLimit, toPrefixTsQuery } from "./query";
import {
  includesSearchType,
  mergeSearchResults,
  rankSearchResults,
  searchResultTypeLabel,
  searchTypeFilterLabel,
  type SearchResult,
} from "./results";

test("toPrefixTsQuery builds AND prefix terms and strips operators", () => {
  assert.equal(toPrefixTsQuery("Fractions Lab"), "fractions:* & lab:*");
  assert.equal(toPrefixTsQuery("  worksheet.pdf  "), "worksheet:* & pdf:*");
  assert.equal(toPrefixTsQuery("foo & bar!"), "foo:* & bar:*");
  assert.equal(toPrefixTsQuery("a"), "a:*");
  assert.equal(toPrefixTsQuery("!!!"), null);
  assert.equal(toPrefixTsQuery("   "), null);
});

test("searchResultLimit is smaller when searching every type", () => {
  assert.equal(searchResultLimit(false), 5);
  assert.equal(searchResultLimit(true), 8);
});

test("type filter labels stay sentence-case product words", () => {
  assert.equal(searchTypeFilterLabel("all"), "All");
  assert.equal(searchResultTypeLabel("unit"), "Unit");
  assert.equal(searchResultTypeLabel("file"), "File");
  assert.equal(includesSearchType("all", "course"), true);
  assert.equal(includesSearchType("unit", "course"), false);
  assert.equal(includesSearchType("file", "file"), true);
});

test("filterPageResults matches staff destinations by title", () => {
  const pages = staffSearchPages("coop");
  assert.deepEqual(
    filterPageResults(pages, "rost").map((row) => row.id),
    ["page:roster"],
  );
  assert.equal(filterPageResults(pages, "").length, 0);
});

test("rankSearchResults orders by type then title match", () => {
  const material: SearchResult = {
    id: "material:1",
    type: "material",
    title: "Lab notes",
    href: "/m/1",
  };
  const courseHit: SearchResult = {
    id: "course:1",
    type: "course",
    title: "Fractions",
    href: "/c/1",
  };
  const courseMiss: SearchResult = {
    id: "course:2",
    type: "course",
    title: "Algebra",
    href: "/c/2",
  };
  const ranked = rankSearchResults(
    mergeSearchResults([[material], [courseMiss, courseHit]]),
    "frac",
  );
  assert.deepEqual(
    ranked.map((row) => row.id),
    ["course:1", "course:2", "material:1"],
  );
});
