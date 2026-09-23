# DISCUSSION

**URL (view):** `/my/<org-slug>/discussions/<discussion_id>`  
**URL (new):** `/my/<org-slug>/discussions/new`  
**URL map:** [URLS.md](../URLS.md)

Optional query on **new:** `audience=course|class` plus `courseId` or `classId` when composing from a course or class page.

## Audience

Staff compose in Teacher view for courses they teach / classes they manage (owners and admins: any in the org). Students compose for a course they are enrolled in or a class they are in. Anyone who can see the thread can post and quote. Staff **Student view** uses the student presentation; opening still marks the thread read for that person.

## Purpose

One two-way **discussion**: title, who it is for, flat posts (plain or Lexical), optional Teams-style quotes in the body, attachments, and an **answered** state.

## Behavior

### View

- Load one non-deleted discussion the actor can see (RLS). Missing or removed: plain-language “this discussion isn’t available,” with a way back to [DISCUSSIONS](./DISCUSSIONS.md).
- Opening the page **marks it read** for the signed-in person (`last_read_at`). Two parents each have their own unread state.
- Posts in conversation order (oldest first). Flat list — no nested replies. Your posts align right (green tint); other people’s align left.
- Author rows for other people’s posts show a **profile circle** left of the display name. Clicking the circle (or name) opens a **user profile modal** with the same content as [USER_PROFILE](./USER_PROFILE.md), plus a **View profile** link to the full page. Your own posts omit the author row.
- **⋯** on a message: **Edit** (own messages — in-place editor + Save; **@mentions** added on save notify in [ACTIVITY](./ACTIVITY.md)), **Quote message** (inserts a Lexical quote into the composer), and **Copy link** (deep link to that message).
- Composer at the bottom: text field; toolbar with **T** (same Lexical chrome as page materials — icon toolbar, `/`, floating format; no quiz), **file**, and **+** (material or link via modal). Typing **@** opens a picker of people on the thread; choosing a name (click or Enter) replaces the query with a mention pill and notifies them in [ACTIVITY](./ACTIVITY.md). Post stays disabled until there is text and/or at least one attachment. Default composer: **Enter** posts, **Shift+Enter** new line (Enter selects from the @ picker when it is open). Rich text (**T**): **⌘/Ctrl+Enter** posts.
- **Mark as answered** / **Mark as open** for the person who started the thread, and for staff who can see it. Answered does not lock posting. Inline in the thread toolbar from `md` up; under **⋯** on small screens.
- Thread toolbar **⋯**: **Started by** note (plain label + started date) with a **user card** for the starter (opens [USER_PROFILE](./USER_PROFILE.md)); on small screens also **Mark as answered** / **Mark as open** and **Delete** when allowed; **Members** opens a modal listing everyone who can currently see the thread (org staff + parents linked to the audience course or class). Each person is a **user card** that opens [USER_PROFILE](./USER_PROFILE.md).
- Staff Teacher view: **Delete** the discussion (soft-delete, confirm) — inline from `md` up; under **⋯** on small screens. A poster may remove their own post; staff may remove any post. Removed posts show “This message was removed.”
- Attachments: files open/play in place (same players as materials); materials and URLs show as separate link cards with a link icon.
- While this page is open, **Realtime** inserts new posts, attachments, answered state, and removes without a refresh. If the reader is not at the bottom, do not yank scroll — show a short “New messages” control instead. Live posts also advance `last_read_at` for the person staying on the thread.

### New

- **Audience** required: **Course** or **Class** — pick the kind, then **one** target. Prefill from the query string when arriving from a course or class page.
- Students only see courses their linked student is enrolled in (active + published) and classes that student is in. Instructors see courses they teach and classes they can manage. Owners and admins see any course or class in the org.
- Title required. Opening post required (text and/or attachment); same plain / **T** Lexical composer. Typing **@** mentions someone who would be on the thread (after a course or class is chosen).
- **Start discussion** stays disabled until there is a title, one audience target, and an opening post.
- Staff Teacher view: **Notify everyone** (off by default). When on, the opening post also notifies everyone who can see the thread in [ACTIVITY](./ACTIVITY.md). Course instructors or class leads are always notified of posts (except the author), as are people who started the thread or posted in it. One new-post Activity item per discussion. **@mentions** also notify that person.
- Cancel returns to the list.
- Staff **Student view** without linked students cannot open `/new` (redirect to org home). Parent-only users without a matching course or class see an empty picker and cannot post.

No `/edit` route — title and audience are not edited after create in this slice.

## Data shown

- **Title** (compact, with back control)
- **Open** / **Answered** badge
- **Audience** kind + course title or class name
- **Started by** (⋯ menu note + starter user card) and started date
- Posts: author **profile circle** + display name (omitted on your own posts) and time/date only above the first message in a consecutive run from that person — time if within 24 hours, otherwise the date (with “(edited)” after an edit on that first message); optional quote block; plain or rich body; attachments. Bubbles shrink to content width.
- Unread vs read is shown on the **list**, not as a badge on this page

Writeable on new: audience, one target, title, opening post (body + attachments), **Notify everyone** (staff Teacher view).  
Writeable on view: new post / quote, edit own post (body + @mentions), answered state (when allowed), remove (when allowed).

## Contents

### View

- Compact title with **←** back to discussions; Open/Answered + audience under the title
- Thread toolbar: **Mark as answered** / **Mark as open** when allowed; **Delete** for staff Teacher view (inline from `md` up; under **⋯** on small screens); **⋯** → Started by (note + user card) + Members
- Message list (flat) with author profile circles → profile modal
- Composer (text + toolbar: **T** / file / **+** for material or link modals)
- Members modal (people with access → [USER_PROFILE](./USER_PROFILE.md))
- User profile modal (same content as [USER_PROFILE](./USER_PROFILE.md))

### New

- Audience picker (course / class + single select)
- Title
- **Notify everyone** (staff Teacher view)
- Opening post (text + attachments; **T** for rich text)
- Start / Cancel ([STYLE_GUIDE.md](../STYLE_GUIDE.md) settings-style header actions)

## Primary actions

- Read and post on the thread (marks read)
- Quote a message / copy message link / edit own message (⋯ menu)
- Open an author’s profile modal (profile circle or name)
- Attach a file, material, or link
- Mark as answered / open (starter or staff)
- View members with access (⋯ → Members)
- Start a discussion
- Delete a discussion (staff) or remove a post (author or staff)

## Links to

- [USER_PROFILE](./USER_PROFILE.md) — member cards and message author profile modal
- [DISCUSSIONS](./DISCUSSIONS.md) — list; cancel from new; back from view
- [COURSE](./COURSE.md) — compose entry from a course (`?audience=course&courseId=`); attached material may return to the course tree
- [CLASS](./CLASS.md) — compose entry from a class (`?audience=class&classId=`)
- [MATERIAL](./MATERIAL.md) — open an attached material
- [ORG_HOME](./ORG_HOME.md) — via chrome
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via student chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [RESOURCES](./RESOURCES.md) (when visible), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Discussions (**P1**, in progress). Not an announcement. No email in this slice. Realtime only while the SPA is open.
