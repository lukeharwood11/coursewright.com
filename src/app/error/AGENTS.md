# AGENTS — `src/app/error/`

Catch-all failure UI and React error boundary.

## Scope

- `ErrorPage.tsx` — branded “something went wrong” screen
- `AppErrorBoundary.tsx` — wraps the SPA route tree
- `hooks/useReportAppError.ts` — one-shot PostHog `captureException`

## Rules

- Report via PostHog only (`infrastructure/posthog`); no second error stack.
- Keep copy plain-language for tech-averse parents.
- No domain business logic here.

## Don’t

- Put course/roster UI on this screen.
- Invent legal or support contact details.
- Mount a public preview route for this screen.
