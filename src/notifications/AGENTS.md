# AGENTS — `src/notifications/`

In-app **Activity**: stored notifications for the signed-in person. Discussion posts notify course instructors or class leads; staff may **Notify everyone** on create.

## Scope

- Org **Activity** list (`activity/`)
- Sidebar unread count (red)
- Ack (`read_at`) on click; opening a discussion also acks matching discussion notifications
- Realtime: `databridge/` subscribes; page hooks and org chrome invalidate TanStack Query

## Rules

- Recipients are written by a Postgres trigger — the SPA only **selects** and **acks** own rows.
- Clicking a row marks it read and opens the activity (discussion post).
- Page folder: `activity/`. Shared `model/` + `databridge/`.
- Distinct from announcement unread icons and the Discussions unread-thread badge.
- No email or push in this slice.

## Don’t

- Insert notification rows from the client.
- Put Activity CRUD in `discussions/` or `parent/`.
- Invent extra notification kinds until FEATURES says so.
