# AGENTS — `src/infrastructure/posthog/`

PostHog browser analytics client.

## Scope

- `client.ts` — init + re-export of the SDK

## Rules

- Public project key only in the SPA (`VITE_POSTHOG_*`).
- Identify users only after login when product docs allow; avoid extra PII.
- No-op when env is missing so local/dev without keys still runs.

## Don’t

- Invent a second analytics stack.
- Put domain event names here without aligning to FEATURES / STACK.
