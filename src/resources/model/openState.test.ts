import assert from "node:assert/strict";
import test from "node:test";
import {
  RESOURCE_OPEN_PERMISSION_MESSAGE,
  parseResourceOpenProbe,
  resourceOpenView,
} from "./openState";

test("permission copy is the short sentence", () => {
  assert.equal(
    RESOURCE_OPEN_PERMISSION_MESSAGE,
    "You do not have permission to view this resource.",
  );
});

test("a loaded row is content even if a probe says forbidden", () => {
  assert.equal(
    resourceOpenView({ rowLoaded: true, probe: "forbidden" }),
    "content",
  );
});

test("same-org forbidden is permission; missing, other-org, and ok-without-a-row are not found", () => {
  assert.equal(resourceOpenView({ rowLoaded: false, probe: null }), "loading");
  assert.equal(
    resourceOpenView({ rowLoaded: false, probe: "forbidden" }),
    "forbidden",
  );
  assert.equal(
    resourceOpenView({ rowLoaded: false, probe: "missing" }),
    "missing",
  );
  assert.equal(resourceOpenView({ rowLoaded: false, probe: "ok" }), "missing");
});

test("unexpected probe values stay missing", () => {
  assert.equal(parseResourceOpenProbe("forbidden"), "forbidden");
  assert.equal(parseResourceOpenProbe("nope"), "missing");
  assert.equal(parseResourceOpenProbe(null), "missing");
});
