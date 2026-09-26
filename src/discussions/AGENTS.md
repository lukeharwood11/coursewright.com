# AGENTS — `src/discussions/`

Two-way **discussions**: a thread for **one course**, **one class**, or the **organization**. Staff may set **family visibility** (parents / students / both). Title, flat posts, Teams-style **Quote** in the message body, plain or Lexical composer (**T**), **@mentions**, attachments, answered state. Live updates while the SPA is open.

**Status:** product is **P1 / in progress** — [FEATURES.md](../../docs/FEATURES.md).

## Scope (when implementing)

- Org list + **New discussion** (staff Teacher view and students who may start one)
- Thread view: posts, quotes, file / material / URL attachments, **Mark as answered**, thread **⋯** → **Members** (user cards → org profile)
- Composer: plain textarea by default; **T** activates the same Lexical chrome as page materials (toolbar, `/`, floating format) without quiz / in-page file upload; **@** mentions a person on the thread; file icon; **+** opens modal for material or link
- Parent list of threads that apply to linked students (same URL; student chrome / Student view)
- Sidebar unread count (red) of threads with new activity since `last_read_at`
- Staff compose: optional **Notify everyone** (Activity notifications). Course instructors / class leads, plus people who started or posted on the thread, are notified of posts (one Activity item per discussion). **@mentions** upgrade that same row when the person is also a lead/instructor — they do not get a second ping.
- Realtime: `databridge/` subscribes via the shared Supabase client; page hooks update TanStack Query

## Rules

- Audience is **one course**, **one class**, or the **organization** — not mixed targets. **family_audience** limits parents vs student accounts; staff always see org threads.
- Families start a thread only for a course their child is enrolled in (active + published) or a class their child is in.
- Everyone who can see the thread can post, except an **Observer** (view-only, including additive parent). Timeline is **flat**; **Quote** is body content, not nested replies / quote columns.
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
