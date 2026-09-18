# Course Wright — Branding

## Name

**Course Wright**

Craftsperson / **playwright** energy: someone who *makes* courses. Also **course right** — the right place for the course.

**Tagline (primary):**

> Plan wright. Share wright. Course Wright.

**Short lockup** (nav, social, tight spaces):

> Courses, done wright.

**Mark (for now):** type only — **Course Wright** in Lora; **CW** in Lora when space is tight. See [STYLE_GUIDE.md](./STYLE_GUIDE.md).

Domain: **coursewright.com** (owned). Testing: **beta.coursewright.com**.

---

## Positioning

**Category:** Learning management for **homeschool co-ops and micro-schools**, with a path to full family and student participation.

**Elevator pitch:**

> Course Wright gives homeschool co-ops and micro-schools one place to plan courses, reuse materials (copy a course; templates later), share with parents, and run their programs — without the clunky complexity of typical school software. Built materials should be **one tap from paper**. Plan wright. Share wright. Course Wright.

**Differentiation:**

Course Wright is built around jobs co-ops and micro-schools actually need done — and does them **simply**:

1. **One hub** for lesson materials and planning
2. **Clear communication** with parents on materials and progress
3. **Radically intuitive UX** — especially for **parents who hate technology**. They should understand what's going on the second they open a link or log in. Co-op volunteers shouldn't need training either.
4. **Extreme shareability** — print, links, files. If a parent created materials and just wants to print them, that is **super easy**.

Course Wright **bills organizations**. Orgs collecting from parents is later.

**Why users switch:**

Today, co-ops stitch together **Microsoft for files**, **WhatsApp for chatter**, and **Outlook for parent email** — plus tools like **Google Classroom** that feel **too heavy-handed** for their size. Course Wright replaces that patchwork with one hub and wins on **usability first**: especially for **parents who hate technology**, who should understand what's going on the moment they open it.

---

## Audience & tone

| Attribute | Direction |
|-----------|-----------|
| **Primary audience (now)** | Co-op and micro-school admins and instructors |
| **Usability anchor** | **Parents who dislike technology** — if it works for them, it works for everyone |
| **Secondary audience (P0)** | Parents — invited by email; **account required** (Google or email). Also parents who **create** materials and print |
| **Secondary audience (P1)** | Parents viewing student progress (grades, notes, checklists) |
| **Primary audience (later)** | Parents managing families; students using materials and quizzes |
| **Voice** | Clear, warm, plain-spoken — guide users without talking down to them |
| **Avoid** | Corporate edu-jargon, district-scale complexity, dense UI copy, feature-dump onboarding, Google Classroom-style heaviness |

---

## Visual identity

**Canonical spec:** [STYLE_GUIDE.md](./STYLE_GUIDE.md)

- **Logo (for now):** Lora wordmark **Course Wright**; short **CW** — no carpenter’s square
- **Type:** Lora (wordmark + headings) · Manrope (all product UI)
- **Color:** Wright Green, Amber, Slate, Paper, Ink (+ tints documented in the style guide)
- **UI:** borders over heavy shadows; badges for status; sentence case

Concept screens (login, parent dashboard, instructor course) are encoded as layout patterns in the style guide.

---

## Messaging

### Tagline options

**Locked:**

- Primary: **Plan wright. Share wright. Course Wright.**
- Short: **Courses, done wright.**

Other drafts kept for reference (not in use):

| Tagline | Angle |
|---------|--------|
| Plan wright. Share wright. Course Wright. | Core P0 jobs |
| Plan wright. Teach wright. Course Wright. | Instructor-first |
| Build wright. Share wright. Course Wright. | Templates + parents |
| Make it wright. Send it wright. Course Wright. | Craft + parent comms |
| Write it wright. Run it wright. Course Wright. | Playwright echo |
| Set it wright. Keep it wright. Course Wright. | Simple, sticky |
| Teach wright. Home wright. Course Wright. | Homeschool / co-op |
| Build once. Teach wright. Course Wright. | Templates (breaks rhythm slightly) |

**Short (if the triple is too long for a nav/hero):**

| Tagline | Angle |
|---------|--------|
| Courses, done wright. | Punchy, "right" pun |
| Make the course wright. | Direct |
| The wright way to run a course. | Plain English |
| Built wright for co-ops. | Audience-specific |
| Get the course wright. | Shortest |

**Playwright-forward:**

| Tagline | Angle |
|---------|--------|
| Playwrights write plays. You write courses. | Explains the name |
| Every course needs a wright. | Craftsperson |
| Write the course. Get it wright. | Double meaning |

### Key messages

1. **Obvious the second you open it** — built for parents who hate technology, and instructors who'd rather teach than manage software.
2. **One place instead of five** — replaces scattered Microsoft folders, WhatsApp threads, and Outlook chains for everyday course stuff.
3. **Share wright — including paper** — print a material, a unit, or this week in one tap. No export wizard.
4. **Lighter than Google Classroom** — co-ops don't need enterprise classroom software.
5. **Built for co-ops and micro-schools** — not bloated district tools.
6. **Parents stay in the loop** — invited by email, then an account (P0). Magic links later. Progress and auto-summaries in P1.
7. **Reuse without rework** — P0: create a course from another course. **P1:** templates with linked copies and optional promote.
8. **We bill the org** — Course Wright charges organizations so they can serve parents. Parent-pay is later.

**Public site:** Keep this positioning, but do **not** paste the Microsoft / WhatsApp / Outlook (or SharePoint) example onto marketing pages — that’s one person’s inspiration, not customer-facing copy. Talk about scattered folders, chats, and email in general. Pricing is an invite-only pilot; do not show plan options.

---

## Product naming conventions

<!-- TBD: Finalize in-app vocabulary -->

| Concept | Preferred term | Alternatives considered |
|---------|----------------|-------------------------|
| Learning group | **Organization** (v1) | co-op, micro-school, program |
| Org URL path | **Permalink** / **slug** | changing it breaks existing links — warn the user |
| Reusable course blueprint | **Template** | **P1** — blueprint, course template |
| Runnable offering | **Course** | content + offering; not a student group |
| Group of students | **Class** | **P0** — cohort / room; **not** a Course; batch preset into course enroll |
| Copy course content into a new course | **Create from course** | **P0** — independent copy; no live sync |
| Template permission | **Owner** / **Edit** / **View** | **P1** — who can access a template (sometimes called ACL) |
| Content grouping | **Unit** | optional; groups materials when set |
| Top-level material | **Course material** (no unit) | shown above the units list |
| Material (in a unit) | **Material** | kind: **page** · **link** · **file** (v1); every material has **title** + **description** |
| Page material body | **Blocks** | only when kind = page; rich text, video, … |
| Page building block | **Block** | rich text, video, **quiz** (**P0** on pages); extensible |
| Material date | **Scheduled date** | optional; wins over unit dates for "this week" |
| Calendar week | **Sunday–Saturday** | parent "this week" |
| Link to one material | **Resource link** | deep link; login required in P0 |
| Print materials | **Print** | not Export; preview is a generated PDF |
| Print preview routes | `…/print`, `/print-this-week` | not `/export`, not `?print=1` |
| Save the generated file | **Download** | on the print screen only — the `.pdf` |
| Print a unit as one packet | **Print unit** | generated PDF packet |
| Print this week's work | **Print this week** | parent dashboard; Sunday–Saturday |
| Course dates | **Start date** / **End date** | optional offering window |
| Course description | **Description** | short stable blurb for the offering — not the P1 **Summary** |
| Course meeting place | **Location** | optional free text — not a Class, not meeting times |
| Course topic | **Subject / area** | optional free text catalog label — not a taxonomy |
| Course family access | **Published** / **Unpublished** | unpublished = instructors/admins; published = enrolled parents. Distinct from **Active** / **Archived** |
| Course grades | **Grade levels** | catalog metadata — multiple grades and/or ranges; not P1 progress grades (**P1 templates** use the same) |
| Course enrollment | **Roster** (page/nav) · **Enroll** / **Unenroll** (verbs) | Schema: `enrollments`. Class may **batch-preset** who to enroll (not a live link) |
| Stored content | **Materials** | page / link / file in a unit |
| Authored lesson page | **Page** (material kind) | composed of **blocks** |
| Uploaded handout | **File** (material kind) | org File + versions |
| External URL | **Link** (material kind) | not a course deep link — that’s **Resource link** |
| Uploaded media on a page | **Video** (block) | URL and/or file — **open**; audio TBD |
| In-product find | **Search** | native, cross-facet — P0 |
| Assessment | **Quiz** | block on a page; printable blank + staff answer key in P0; autograde when online — **P1** |
| Structured response | **Form** | not a quiz — in design |
| Uploaded file | **File** | attachment, upload |
| Prior file blob | **File version** | replace keeps old Storage objects for revert |
| Org people | **Roster** | students, staff, enrollments |
| Course materials | **Course materials** | content on a course |
| Push course → template | **Promote to template** | **P1** — opt-in, not automatic |
| Unmodified linked copy | **In sync** | **P1** — receives template edits for that resource |
| Customized course copy | **Overridden** | **P1** — no longer receives template edits |
| Retire without disrupting courses | **Deprecate** | **P1** — active courses untouched |
| Soft-remove from template | **Delete** | **P1** — soft-deletes template + unmodified course copies |
| Parent invite | **Invite** | email invite |
| Parent entry | **Invite → account** | same email as invite |
| This week's content | **This week** | material scheduled date if set, else unit date range; Sunday–Saturday |
| Dated unit material (P0 homework) | **Material** (with dates) | not an assignment object yet |
| Extra org admin | **Admin invite** | email, claimable |
| Instructor priority flag | **Important now** | pinned, highlight, urgent |
| Course context blurb | **Summary** | **P1** — auto-drafted “what’s going on this week”; not the course **Description** |
| Parent view (with account) | **Progress** | grades, notes, checklists, homework |
| Person being taught | **Student** (profile) | student_profile, learner |
| Student year/level | **Grade level** | optional on student; org chooses exact vs. range |
| Student login (P2) | **Student account** | links to student profile |
| Person teaching | **Instructor** | teacher, admin |
| Family unit (org) | **Family** | household — **P0** org-scoped; parent directory |
| Org family list | **Parent directory** | browse families / parents from roster |
| Family across orgs (P2) | **Family management** | parents manage household across orgs |

---

## Open branding questions

- Marketing balance: lead with **"co-op"**, **"micro-school"**, or both equally?
- Wordmark / **CW** spacing when we draw a real lockup file
