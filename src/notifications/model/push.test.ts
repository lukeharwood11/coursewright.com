import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isInstalledPwa,
  pushSettingMode,
  shouldShowPushPrompt,
  shouldSyncPushSubscription,
} from "./push.ts";

test("isInstalledPwa is standalone, fullscreen, or iOS home screen", () => {
  assert.equal(isInstalledPwa({ standalone: true, displayMode: "browser" }), true);
  assert.equal(isInstalledPwa({ displayMode: "standalone" }), true);
  assert.equal(isInstalledPwa({ displayMode: "fullscreen" }), true);
  assert.equal(isInstalledPwa({ displayMode: "browser" }), false);
  assert.equal(isInstalledPwa({ displayMode: "minimal-ui" }), false);
});

test("push sync runs only for an installed app that has not been turned off", () => {
  assert.equal(
    shouldSyncPushSubscription({
      installed: true,
      permission: "granted",
      disabledOnDevice: false,
    }),
    true,
  );
  assert.equal(
    shouldSyncPushSubscription({
      installed: false,
      permission: "granted",
      disabledOnDevice: false,
    }),
    false,
  );
  assert.equal(
    shouldSyncPushSubscription({
      installed: true,
      permission: "granted",
      disabledOnDevice: true,
    }),
    false,
  );
  assert.equal(
    shouldSyncPushSubscription({
      installed: true,
      permission: "default",
      disabledOnDevice: false,
    }),
    false,
  );
});

test("org prompt shows for default permission when push is ready, and for a block", () => {
  const ready = {
    installed: true,
    serviceWorkerReady: true,
    publicKeyReady: true,
    permission: "default" as const,
    dismissed: false,
  };
  assert.equal(shouldShowPushPrompt(ready), true);
  assert.equal(shouldShowPushPrompt({ ...ready, dismissed: true }), false);
  assert.equal(shouldShowPushPrompt({ ...ready, installed: false }), false);
  assert.equal(shouldShowPushPrompt({ ...ready, publicKeyReady: false }), false);
  assert.equal(
    shouldShowPushPrompt({ ...ready, permission: "denied", publicKeyReady: false }),
    true,
  );
  assert.equal(shouldShowPushPrompt({ ...ready, permission: "granted" }), false);
});

test("account setting explains install, on, off, and blocked", () => {
  assert.equal(
    pushSettingMode({
      installed: false,
      serviceWorkerReady: false,
      publicKeyReady: false,
      permission: "default",
      subscribed: false,
      disabledOnDevice: false,
      checked: false,
    }),
    "install",
  );
  assert.equal(
    pushSettingMode({
      installed: true,
      serviceWorkerReady: true,
      publicKeyReady: false,
      permission: "default",
      subscribed: false,
      disabledOnDevice: false,
      checked: true,
    }),
    "hidden",
  );
  assert.equal(
    pushSettingMode({
      installed: true,
      serviceWorkerReady: true,
      publicKeyReady: true,
      permission: "denied",
      subscribed: false,
      disabledOnDevice: false,
      checked: false,
    }),
    "blocked",
  );
  assert.equal(
    pushSettingMode({
      installed: true,
      serviceWorkerReady: true,
      publicKeyReady: true,
      permission: "granted",
      subscribed: true,
      disabledOnDevice: false,
      checked: true,
    }),
    "on",
  );
  assert.equal(
    pushSettingMode({
      installed: true,
      serviceWorkerReady: true,
      publicKeyReady: true,
      permission: "granted",
      subscribed: false,
      disabledOnDevice: true,
      checked: true,
    }),
    "turn-on",
  );
});
