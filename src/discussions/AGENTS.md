# AGENTS — `src/discussions/`

Two-way **discussions**: a thread for **one course** or **one class**. Title, flat posts, Teams-style **Quote** in the message body, plain or Lexical composer (**T**), attachments, answered state. Live updates while the SPA is open.

**Status:** product is **P1 / in progress** — [FEATURES.md](../../docs/FEATURES.md).

## Scope (when implementing)

- Org list + **New discussion** (staff Teacher view and families who may start one)
- Thread view: posts, quotes, file / material / URL attachments, **Mark as answered**, thread **⋯** → **Members**
- Composer: plain textarea by default; **T** activates the same Lexical chrome as page materials (toolbar, `/`, floating format) without quiz / in-page file upload; file icon; **+** opens modal for material or link
- Parent list of threads that apply to linked students (same URL; parent chrome / Parent view)
- Sidebar unread count (red) of threads with new activity since `last_read_at`
- Staff compose: optional **Notify everyone** (Activity notifications). Course instructors / class leads are always notified of posts.
- Realtime: `databridge/` subscribes via the shared Supabase client; page hooks update TanStack Query

## Rules

- Audience is **one course or one class** — not mixed, not a list of students in this slice.
- Families start a thread only for a course their child is enrolled in (active + published) or a class their child is in.
- Everyone who can see the thread can post. Timeline is **flat**; **Quote** is body content, not nested replies / quote columns.
- Author of the thread or staff who can see it mark **answered** (and unmark). Answered does not lock posting.
- Soft-delete only. Course-from-course copy does **not** copy discussions.
- Page folders: `discussions/` (list), `discussion/` (view), `discussion-new/` (compose). Shared `model/` + `databridge/`.
- Do not put discussion CRUD in `parent/`. Unread badge lives in org chrome via this domain.
- Attachments reuse org `File` / Storage and published materials the poster can already view.
- No email in this slice. In-app Activity notifications live in `notifications/`.

## Don’t

- Treat this as an announcement (those are one-way).
- Nest replies or store quote FKs / quote columns on `discussion_messages`.
- Put a discussion card stack on This week home.
- Add typing indicators, email, or push here.
- Hard-delete discussion rows from the app.
