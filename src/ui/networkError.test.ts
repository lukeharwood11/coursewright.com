import assert from "node:assert/strict";
import { test } from "node:test";
import { isNetworkError } from "./networkError.ts";

test("detects common fetch failure strings", () => {
  assert.equal(isNetworkError("Failed to fetch"), true);
  assert.equal(isNetworkError("TypeError: Failed to fetch"), true);
  assert.equal(isNetworkError("Load failed"), true);
  assert.equal(
    isNetworkError("NetworkError when attempting to fetch resource."),
    true,
  );
  assert.equal(isNetworkError("Network request failed"), true);
});

test("detects Error instances", () => {
  assert.equal(isNetworkError(new TypeError("Failed to fetch")), true);
  assert.equal(
    isNetworkError(Object.assign(new Error("offline"), { name: "NetworkError" })),
    true,
  );
});

test("rejects ordinary app errors", () => {
  assert.equal(isNetworkError("Name is required."), false);
  assert.equal(isNetworkError(new Error("Couldn’t save.")), false);
  assert.equal(isNetworkError(null), false);
  assert.equal(isNetworkError(undefined), false);
});
