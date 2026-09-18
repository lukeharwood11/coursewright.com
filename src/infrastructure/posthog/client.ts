import posthog from "posthog-js";

/**
 * PostHog browser analytics.
 * Requires VITE_POSTHOG_KEY (+ optional VITE_POSTHOG_HOST); see `.env.testing`.
 */

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const host =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
  "https://us.i.posthog.com";

export const isPostHogConfigured = Boolean(key);

let started = false;

export function initPostHog() {
  if (started || !key) return;
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    // Unhandled window errors + promise rejections; boundary still calls captureException.
    capture_exceptions: true,
  });
  started = true;
}

export { posthog };
