# DISCUSSION

**URL (view):** `/my/<org-slug>/discussions/<discussion_id>`  
**URL (new):** `/my/<org-slug>/discussions/new`  
**URL map:** [URLS.md](../URLS.md)

Optional query on **new:** `audience=course|class` plus `courseId` or `classId` when composing from a course or class page.

## Audience

Staff compose in Teacher view for courses they teach / classes they manage (owners and admins: any in the org). Families compose for a course their child is enrolled in or a class their child is in. Anyone who can see the thread can post and quote. Staff **Parent view** uses the family presentation; opening still marks the thread read for that person.

## Purpose

One two-way **discussion**: title, who it is for, flat posts (plain or Lexical), optional Teams-style quotes in the body, attachments, and an **answered** state.

## Behavior

### View

- Load one non-deleted discussion the actor can see (RLS). Missing or removed: plain-language “this discussion isn’t available,” with a way back to [DISCUSSIONS](./DISCUSSIONS.md).
- Opening the page **marks it read** for the signed-in person (`last_read_at`). Two parents each have their own unread state.
- Posts in conversation order (oldest first). Flat list — no nested replies. Your posts align right (green tint); other people’s align left.
- **⋯** on a message: **Edit** (own messages — in-place editor + Save), **Quote message** (inserts a Lexical quote into the composer), and **Copy link** (deep link to that message).
- Composer at the bottom: text field; toolbar with **T** (same Lexical chrome as page materials — icon toolbar, `/`, floating format; no quiz), **file**, and **+** (material or link via modal). Post stays disabled until there is text and/or at least one attachment. Plain mode: **Enter** posts, **Shift+Enter** new line. Rich text (**T**): **⌘/Ctrl+Enter** posts.
- **Mark as answered** / **Mark as open** for the person who started the thread, and for staff who can see it. Answered does not lock posting. Both actions sit in the thread toolbar with icons.
- Thread toolbar **⋯**: **Members** opens a modal listing everyone who can currently see the thread (org staff + parents linked to the audience course or class).
- Staff Teacher view: **Delete** the discussion (soft-delete, confirm). A poster may remove their own post; staff may remove any post. Removed posts show “This message was removed.”
- Attachments: files open/play in place (same players as materials); materials and URLs show as separate link cards with a link icon.
- While this page is open, **Realtime** inserts new posts, attachments, answered state, and removes without a refresh. If the reader is not at the bottom, do not yank scroll — show a short “New messages” control instead. Live posts also advance `last_read_at` for the person staying on the thread.

### New

- **Audience** required: **Course** or **Class** — pick the kind, then **one** target. Prefill from the query string when arriving from a course or class page.
- Families only see courses their linked student is enrolled in (active + published) and classes that student is in. Instructors see courses they teach and classes they can manage. Owners and admins see any course or class in the org.
- Title required. Opening post required (text and/or attachment); same plain / **T** Lexical composer.
- **Start discussion** stays disabled until there is a title, one audience target, and an opening post.
- Staff Teacher view: **Notify everyone** (off by default). When on, the opening post also notifies everyone who can see the thread in [ACTIVITY](./ACTIVITY.md). Course instructors or class leads are always notified of posts (except the author).
- Cancel returns to the list.
- Staff **Parent view** without linked students cannot open `/new` (redirect to org home). Parent-only users without a matching course or class see an empty picker and cannot post.

No `/edit` route — title and audience are not edited after create in this slice.

## Data shown

- **Title**
- **Open** / **Answered** badge
- **Audience** kind + course title or class name
- **Started by** + started date
- Posts: author display name, time (with “(edited)” after an edit), optional quote block, plain or rich body, attachments
- Unread vs read is shown on the **list**, not as a badge on this page

Writeable on new: audience, one target, title, opening post (body + attachments), **Notify everyone** (staff Teacher view).  
Writeable on view: new post / quote, answered state (when allowed), remove (when allowed).

## Contents

### View

- Title (display type) + Open/Answered + audience + started by
- Thread toolbar: **Mark as answered** / **Mark as open** when allowed; **Delete** for staff Teacher view; **⋯** → Members
- Message list (flat)
- Composer (text + toolbar: **T** / file / **+** for material or link modals)
- Back to discussions
- Members modal (people with access)

### New

- Audience picker (course / class + single select)
- Title
- **Notify everyone** (staff Teacher view)
- Opening post (text + attachments; **T** for rich text)
- Start / Cancel ([STYLE_GUIDE.md](../STYLE_GUIDE.md) settings-style header actions)

## Primary actions

- Read and post on the thread (marks read)
- Quote a message / copy message link / edit own message (⋯ menu)
- Attach a file, material, or link
- Mark as answered / open (starter or staff)
- View members with access (⋯ → Members)
- Start a discussion
- Delete a discussion (staff) or remove a post (author or staff)

## Links to

- [DISCUSSIONS](./DISCUSSIONS.md) — list; cancel from new; back from view
- [COURSE](./COURSE.md) — compose entry from a course (`?audience=course&courseId=`); attached material may return to the course tree
- [CLASS](./CLASS.md) — compose entry from a class (`?audience=class&classId=`)
- [MATERIAL](./MATERIAL.md) — open an attached material
- [ORG_HOME](./ORG_HOME.md) — via chrome
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via parent chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Discussions (**P1**, in progress). Not an announcement. No email in this slice. Realtime only while the SPA is open.
