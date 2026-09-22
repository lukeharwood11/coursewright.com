import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resourceBrowsePath,
  resourceFolderPath,
  resourceItemEditPath,
  resourceItemPath,
  resourceItemPrintPath,
  resourceItemsPrintPath,
  parseResourcePrintItemIds,
  resourcesPath,
  resourcesPathWithType,
} from "./paths.ts";

test("resource paths nest under /resources", () => {
  assert.equal(resourcesPath("coop"), "/my/coop/resources");
  assert.equal(resourceFolderPath("coop", 4), "/my/coop/resources/folders/4");
  assert.equal(resourceBrowsePath("coop", null), "/my/coop/resources");
  assert.equal(resourceBrowsePath("coop", 4), "/my/coop/resources/folders/4");
  assert.equal(resourceItemPath("coop", 9), "/my/coop/resources/items/9");
  assert.equal(resourceItemEditPath("coop", 9), "/my/coop/resources/items/9/edit");
  assert.equal(resourceItemPrintPath("coop", 9), "/my/coop/resources/items/9/print");
  assert.equal(
    resourceItemsPrintPath("coop", [2, 9]),
    "/my/coop/resources/print?items=2,9",
  );
  assert.deepEqual(parseResourcePrintItemIds("?items=2,9,no"), [2, 9]);
  assert.equal(
    resourcesPathWithType("coop", null, "file"),
    "/my/coop/resources?type=file",
  );
});
