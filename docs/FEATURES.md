# Course Wright — Features

Feature priorities: **P0** (must have for first usable release), **P1** (important soon after), **P2** (later / nice to have).

### Status tracking

| Status | Means |
|--------|--------|
| `planned` | Not started in the app (schema-only still counts as planned unless UI/API work has begun) |
| `in design` | Spec / workshop open — do not implement as locked behavior |
| `in progress` | Actively being built (UI, flows, Edge Functions, or non-trivial app wiring) |
| `shipped` | Usable end-to-end for this feature’s scoped phase |
| `deferred` | Explicitly postponed |

**Agents:** When you **start** a feature, set its Status to `in progress` (and a short Notes update if helpful). When you **finish** the scoped work, set it to `shipped` (or `deferred` if intentionally parked). Do not invent new feature rows — ask or leave TBD. See root [AGENTS.md](../AGENTS.md).

Use the Notes column for blockers, partials (e.g. “schema ready; no UI”), and phase pointers.

---

## Cross-cutting: Usability

Usability is a **P0 requirement**, not a later polish pass. Every feature below must meet this bar.

**Design anchor:** Parents who **hate technology**. They open a link or the app and must understand **what's going on immediately** — which course, which child, what materials, what's due. No manuals, no LMS jargon, no hunting through menus.

**Instructor/admin bar:** A co-op volunteer or teaching parent completes core tasks **without training or documentation**.

**Shareability bar:** Sharing is a **P0 job**, not a later export. If someone built materials and wants them on paper or in someone else's hands, that path is **one obvious action** — not a wizard, not a download-then-open-then-print dance.

**Rules:**

- Flows are **short and obvious** — minimize steps, menus, and jargon
- Parent-facing views are **simpler** than instructor views, not equal complexity
- Empty states and first-run experiences clearly answer **"what do I do next?"**
- Prefer one clear path over configurable complexity
- **Responsive web must work well on phones** — no native app, but parents will open links on mobile
- Avoid **Google Classroom-style density** — lighter, clearer, co-op-scaled
- **Print and share sit in the open** — never nested in overflow menus
- **Create → print does not require a roster** — no students, invites, or parent accounts needed to print what you made

If a feature can't be built intuitively for a tech-averse parent, **simplify the feature** before shipping it.

---

## P0 — Must have (short term)

**Audience:** Co-op and micro-school **admins**, **instructors (teachers)**, and **parents** — including a parent who creates materials themselves and just wants them **on paper**.

A **parent (person)** who signs up to make their own materials is the org **owner** (anyone can create an org). The **parent role** is for invited families viewing someone else's course. Both paths get the same print bar.

**Core value:** A **course builder** with **organizational management**, **roster management**, **RBAC**, **file sharing**, and **extreme shareability** (print + links), so admins can run the org, instructors build and share courses, and parents can **use the materials** — on screen or printed — without extra software.

### P0 feature set

| Feature | Description | Status | Notes |
|---------|-------------|--------|-------|
| **Marketing site** | Public home, about, pricing | shipped | Home/about stay general (no named third-party tools). Pricing is **invite-only pilot** — no plan options. Contact / privacy / terms / cookies still construction placeholders |
| **Authentication** | Sign up, sign in | shipped | **Email (password or magic link) + Google** via **Supabase Auth**. Signup is Google or **email + password** and **signs the person in** (no extra login step). Login keeps password + magic-link. Session gates live |
| **Account settings** | Cross-org account page (`/my/settings`) | shipped | View + **edit display name** (`profiles.name`) + sign-out. Email is read-only (auth-owned). Avatar, Google link management, and preferences still TBD |
| **Organizations** | Anyone can create an org; creator is first **owner**; org picker (`/my`) | shipped | Create + list + `/my/:orgSlug` home + org settings (identity, permalink, grade scheme); **collapsible org sidebar**; staff home dashboard; staff **invite + copy link**; **change/remove staff** in org settings. Billing remains P1 |
| **Org permalink** | Stable org URL (`slug`) created with the org | shipped | Create + settings change with break-links warning |
| **Org grade scheme** | Org chooses how grades work (exact / range / custom; presets K–12, Custom) | shipped | Defaults on create; owners/admins edit in org settings |
| **Admin invites** | Add other admins by email; those emails can be **claimed** by accounts | shipped | v0: invite owner/admin/instructor; **copy a claim link** (no email send); invitee sees pending requests after login |
| **Student profiles** | Org-level student records — no dedicated student role required | shipped | Org roster create/edit + profile page; **multiple parent invites** + optional **student email** (same claim path). Parent invite copy-link on profile and course roster. Created when first added to a course or class; dedicated student role later (P2) |
| **Classes** | Org-scoped **group of students** — separate from a Course | shipped | Create class + batch add/remove members. Class is a **batch preset** into course enroll (not a live link) |
| **Roster management** | Manage org people: student profiles, **classes**, course enrollments, staff | shipped | List-first org / class / course roster with **batch select** enroll/add; multiple parent invites + optional student email; parent invite is copyable claim link (no email send) |
| **RBAC** | Role-based access control across the org | in progress | Membership roles + RLS live; app switches parent vs staff home. **P0 roles:** owner, admin, instructor, parent. Owner vs admin = billing. Staff change/remove is **membership-only** — materials/roster stay enrollment-gated. **Staff parent view** in progress (header toggle) |
| **Admin account management** | Admins invite, **change roles**, and **remove** admins/instructors | shipped | Org settings updates `memberships` only (admin ↔ instructor; remove admin/instructor). Last owner/admin blocked in DB + UI. Does **not** add a staff-role gate on materials/roster RLS. Invite/copy-link unchanged |
| **Homework (P0)** | Dated materials in a unit — appear on parent "this week" when dates fall in Sun–Sat | shipped | Optional **assignment date** (`scheduled_date`) and optional **due date** (`due_date`). Parent home shows **Assigned next** / **Due next**; This week includes either date in range. **Not** a separate assignment type |
| **Course builder** | Create and organize **courses** within an org (no templates in P0) | shipped | Create, course home, units, materials (page/link/file), print/share chrome; collapsible course outline (units + materials tree) |
| **Courses (instances)** | Runnable offerings with dates and a roster — from scratch or **copied from another course** | shipped | Create from scratch + settings + roster. Copy via Function. Catalog: **description**, **location**, **subject / area**, optional **icon** on list cards. **Templates are P1** |
| **Create course from course** | Duplicate an existing course’s units/materials into a new independent course | shipped | Edge Function `create-course-from-course` deployed on testing; copy content only — **no roster**, **no live sync**. Copies start unpublished |
| **Course visibility** | **Published / unpublished** controls whether families can see the course | shipped | Unpublished: amber warning + Publish. Published: green check badge by title; Unpublish lives in course settings. Distinct from `status` (active / archived) |
| **Co-teaching** | Multiple instructors per course | shipped | Course settings: owners/admins add co-teachers (RLS); instructors see the list |
| **Units** | Materials organized in **units**; each unit may have optional dates | shipped | Course home + unit page; **courses only** in P0 |
| **Rich materials** | **Add material** kinds: **page** / **link** / **file**; pages are ordered **blocks** | shipped | v1 kinds. Page editor is [Lexical](https://lexical.dev/); rich text stored as `body.lexical`. Toolbar: headings, lists, tables, quotes, links, video URLs, in-page file attachments, **quizzes** |
| **Material visibility** | **Published / unpublished** controls who can see a material | shipped | Unpublished: amber warning + Publish. Published: green check badge by title; Unpublish at bottom of material view/edit. New materials start unpublished |
| **Quizzes (author + print)** | Create quizzes, mark correct answers, print blank (+ instructor answer key) | shipped | **Quiz = block on a page** (Lexical `quiz` node in `body.lexical`; not a material kind). Many per page. Answers stored on the node. Whole-page print: parent/student = questions only; staff = answer key. Multiple-choice choices use drawn SVG checkbox squares (blank for students; filled check on the answer key) — not `[ ]`/`[X]` text or Unicode bullets. No roster required. Online take is **P1** |
| **File sharing** | Upload and attach files; share with parents as part of course materials | shipped | File materials upload to Storage `org-files` with `files` / `file_versions` |
| **Audio & video files** | Video as a **block** on a material page; uploaded audio TBD | shipped | Video **URL embed** in page blocks (upload vs URL still **TBD**). Uploaded audio/video also play when attached inside a page or as a file material |
| **Course grade levels** | Courses carry **grade metadata** — multiple grades and/or ranges | shipped | Editor on create + course settings. Templates get the same model in **P1** |
| **Advanced search** | Native, easy, **cross-facet** search — “where do I have this resource?” | in progress | Staff chrome overlay (no `/search` route): Postgres FTS on `search_vector` for courses + materials; staff pages by title. Findability only (RLS). Deferred: facets, files, units, people, parent search, `ts_rank`, dedicated index |
| **Families / parent directory** | Named group of **student profiles**; parents appear via `parent_student_links`; org **parent directory** | shipped | Class-mirror members. Link parent creates/reuses student links (`admin_invites` `role=parent` if no account). **Never enrollments.** `family_members.parent_user_id` unused in P0 app. Extra fields, merge/split, and invite **email send** still open. Copy-link claim lives on roster/profile. **SPA directory UI currently not routed** (schema + databridge remain) |
| **Print materials** | One-tap print of a material, a unit, or this week's work | shipped | [PRINT](./pages/PRINT.md): `@react-pdf/renderer` + in-app preview, Download / Print. Whole-course print out of P0 |
| **Lesson materials & planning** | Unified storage for course content, files, and plans | shipped | Course builder authoring on courses |
| **Content versioning** | Versions of course content; who changed what; revert dangerous actions | shipped | Restore a `material_versions` snapshot from material edit; file blob revert on file materials. Page/placement edits version only on Save when something changed |
| **Soft deletes** | Content is never hard-deleted | shipped | Remove/restore on units and materials (`deleted_at`) |
| **Parent invites (email)** | Invite parents by email to access shared content | shipped | v0: copy `/invite/<token>` (same path as staff); no email send. Membership + student link on claim. Unrouted family directory can also insert `admin_invites` `role=parent` when linking an email with no account |
| **Parent access (link or account)** | Parent clicks invite link **or** signs up / logs in with the **same email** | shipped | Unified `/invite/<token>` claim; course access still requires enrollment |
| **Parent org membership** | Parent becomes a parent in the org when they claim an invite | shipped | Membership created on claim; materials still gated on enrollment + published course |
| **Share resources with parents** | Share course content and files with enrolled families | shipped | Copy material URL (account required). Dedicated share-entry path still TBD |
| **Parent dashboard** | This calendar week's dated materials, **Up next**, **Important now**, student tags, **Print this week** for active students | in progress | Parent/student home; student login still uses parent claim path. Staff can open this home via **Parent view** |
| **Resource links** | Send a parent a link that opens a **specific resource** (after they log in) | shipped | Copy signed-in material URL; `share_links` row recorded. Public entry path still TBD |
| **Instructor "important now"** | Flag items needing immediate parent attention | shipped | Toggle on material; parent home surfaces it |
| **Staff parent view** | Owners, admins, and instructors switch most org pages to parent presentation | in progress | Header **Teacher** / **Parent view**. Real this-week if they have linked students; otherwise a preview. Hidden for parent-only users |

### Roster management (P0)

Roster exists at **three** levels: **organization** (student profiles, staff), **class** (named group of students), and **course** (who participates in an offering).

**UI vocabulary:** page/nav noun is **Roster**; course verbs are **Enroll** / **Unenroll**; class/org verbs are **Add** / **Remove**. Batch select is the default add path.

| Capability | Who | Notes |
|------------|-----|-------|
| **Student profiles** | Admin, **instructor** | Org-level record for each student — **no user account required** |
| **Classes** | Admin, instructor | Named groups of student profiles — **not** a course; no materials |
| **Add student via course / class** | **Instructor** | First-time add creates `student_profile` in the org; **batch create** (paste names / multi-row) supported |
| **Course roster** | **Instructor** (their courses) | Enroll **individuals** (multi-select); optional **Class preset** checks that class’s members once |
| **Parent linkage** | Admin, instructor | Associate **one or more** parent emails with each student profile |
| **Parent invites** | Admin, instructor | Copy a claim link from roster or student profile (**v0: no email send**) |
| **Staff / instructor assignment** | Owner, admin | Assign instructors to courses |
| **Admins** | Owner, admin | Multiple admins; invite by email (claimable) |
| **Billing (P1)** | Owner | Course Wright bills the org — admins cannot manage payment |

### Classes (P0)

A **Class** is an org-scoped **group of students**. It is **not** a Course.

| | **Class** | **Course** |
|---|-----------|------------|
| **Purpose** | Group students (e.g. “Wednesday cohort”, “Room A”) | Plan and share materials for an offering |
| **Materials / units** | None | Yes |
| **Members** | Student profiles | **Enrollment** → `student_profile` (individuals) |
| **Dates / grade metadata** | Name + members only (P0) | Optional start/end; optional grade levels |

**Decided:** Class and Course are separate concepts. Class list lives on the org roster; class roster is `/my/<org-slug>/classes/<class_id>`. Admins and instructors manage classes (same as the roster capability table).

**Decided (enrollment):**

1. A course enrolls **individuals** (`enrollment → student_profile`). A Class may be used as a **batch preset** when enrolling (one-shot copy of members into enrollments — **not** a live link).
2. Students may be in **multiple classes** and **multiple courses**.
3. Parent “this week” / access keys off **course enrollment** only; Class never grants materials, this-week, or print.
4. Class fields in P0: **name** + members.

Keep **Course.enrollment → student_profile** as the access gate for parents.
### Org creation & admins (P0)

| Rule | Detail |
|------|--------|
| **Who can create an org** | **Anyone** (signed-in or as part of signup) |
| **First owner** | The person who creates the org — they can manage the org **and** (P1) billing |
| **Admins** | Same org management as owners (name, permalink, grade scheme, staff) except **billing** |
| **More admins** | Owner/any admin adds **emails**; those people **claim** the seat with an account on that email. **v0:** copy a link (no email send); login also shows pending requests |
| **Multiple admins** | Yes — no single-admin limit |
| **Change staff roles** | Owners and admins can change **admin ↔ instructor** for existing staff. Writes **`memberships.role` only**. Does **not** gate course materials or roster on staff role — families still see content via **enrollment** (and `parent_student_links` where applicable) |
| **Remove staff** | Owners and admins can **remove** admins and instructors from the org (end that membership). Does **not** rewrite materials/roster RLS |
| **Last owner/admin** | Cannot remove or demote the **last remaining owner or admin** (org lockout guard) |
| **Org permalink** | On create, generate a unique **`slug`** used as the org’s permalink URL. Owners and admins may change it later; the UI **must warn** that changing the slug **breaks existing links** (no automatic redirect required in P0) |

### Student profiles (P0)

Students are represented as **`student_profile`** records in the organization — not user accounts.

| Rule | Detail |
|------|--------|
| **No student role yet** | Student profiles do not have a dedicated membership role in P0/P1. Optional **student email** can be invited with the same parent claim path so that person sees this one student's work |
| **Created on first enrollment** | When an instructor adds a student to a course and they don't exist in the org yet, a `student_profile` is created automatically |
| **Future accounts (P2)** | A dedicated student role can be linked to an existing `student_profile` via `user_id` — profile stays the canonical record |

**Fields:**

| Field | Required | Notes |
|-------|----------|-------|
| **Name** | Yes | That's the only required field |
| **Parent emails** | Optional | One or more. First email may be stored on create; more parents are invited from the student profile |
| **Student email** | Optional | Contact email for the student. Staff can copy an invite so that email can sign in and see this student's work (parent claim path) |
| **Grade level** | Optional | Value depends on **org grade scheme** — exact grade or range |

### Org grade scheme (P0)

Each organization **chooses how student grade levels work**. Course Wright provides options; the org must pick one.

| Scheme | Example | Notes |
|--------|---------|-------|
| **Exact grade** | 3rd, 7th, 11th | Single discrete level |
| **Grade range** | K–2, 3–5, 6–8 | Band instead of one grade |
| **Custom** | Org-defined labels | Can include ranges (e.g. K–2) or other bands |

**Shipped presets:** **K–12** and **Custom**. Org must choose.

Student profile `grade_level` is optional and must match the org's chosen scheme when set.

### Course grade metadata (P0)

**Courses** carry **grade-level metadata** so instructors can find and filter offerings by who they're for — separate from student profile grade, and separate from P1 progress grading. (**Course templates** use the same model when templates ship in **P1**.)

| Rule | Detail |
|------|--------|
| **Required?** | Optional on a course, but when set must follow the org's **grade scheme** |
| **Multiple grades** | Yes — a course may target more than one discrete grade (e.g. 3rd **and** 4th) |
| **Ranges** | Yes — a course may use a band (e.g. K–2, 6–8) when the org scheme allows ranges |
| **Mix** | Multiple values and/or ranges are allowed together when the scheme supports them |
| **Copy from course** | Grade metadata may be copied into the new course when creating from another course (editable after) |

This is **catalog metadata** (“what ages/grades is this course for?”), not student report-card grades (those remain **P1 Progress — grading**).

### Advanced search (P0)

Teachers will ask **“where do I have this resource?”** Search is a **core P0 job**, not a later filter on a list page.

| Requirement | Detail |
|-------------|--------|
| **Native & easy** | Always-available search in the product chrome — obvious, not buried |
| **Cross-facet** | Combine free-text with structured facets (e.g. course, unit, material kind, file type, grade level, instructor, dates, important now) |
| **Cross-functional** | One search surface can reach materials, files, courses, units, roster people, and families the actor can access |
| **Optimize for findability** | Titles, filenames, content text (where indexed), tags/metadata, and grade levels must be searchable; schema and indexes designed for this from day one |
| **RLS-respecting** | Results only include what the current user can already access |

**Stack note:** Prefer Postgres full-text + facet filters via PostgREST; escalate to a dedicated index only if needed — [STACK.md](./STACK.md).

**This slice (staff chrome):** Overlay search uses generated `search_vector` GIN indexes via PostgREST `fts(english)` (`to_tsquery`, not `plainto_tsquery`) for **courses** and **materials**, so prefixes like `frac` match Fractions. Staff **pages** (Home / Courses / Roster / Settings) match by title in the client. Staff only; no `/search` route; no Algolia/Elastic/side index. Hits are findability only — they do not grant access; enrollment / `parent_student_links` stay the gate.

**Deferred:** facets, files, units, roster people / families, page/block body text, `ts_rank`, parent search, dedicated `/search` route.

### Families & parent directory (P0, org-scoped)

**Access lock:** Family = named group of `student_profile`s (Class-mirror). Empty family is OK. Access stays course enrollment + `parent_student_links`. A family profile does **not** grant materials, this-week, or print.

Parents appear on a family **only** via existing `parent_student_links` to those students. Do **not** invent a family-membership access table, and do not treat `family_members.parent_user_id` as an access gate (column unused for P0 app writes). Linking a parent reuses or creates `parent_student_links` (and may save a pending `admin_invites` row with `role=parent` and `student_profile_id` if they have no account). **Never write enrollments** from this directory. A parent on two families is **yes by default** (via links to students in each).

| Concept | Detail |
|---------|--------|
| **Family** | Org-scoped **named group of student profiles** (same shape as a Class) |
| **Family profile** | Display **name** required in the directory; member **names** at minimum; **additional fields TBD** |
| **Parent directory** | Org list + sidebar of families — find a household without hunting the course roster |
| **How it forms** | Staff create a named family, then add existing or new student profiles (a student is in at most one family) |
| **Parents on a family** | Derived from `parent_student_links` to member students — not from family membership rows |
| **Link parent** | Create or reuse `parent_student_links` for the chosen student(s); if no account, save `admin_invites` with `role=parent` and those `student_profile_id`s |
| **Visibility** | Owners, admins, and instructors (Class-mirror). Parent-facing family profile is TBD |

**Not P0:** full parent-managed household **across organizations** — that stays **P2** ([Parent family management](#p2--later-long-term)). Invite **email send** is still out of scope. Copy-link claim is `/invite/<token>` from roster/profile (this directory, when routed, may insert a pending `admin_invites` row with `role=parent`).

**Open:** extra family profile fields beyond names; merge/split UX; parent-facing family profile.

### Courses vs. course templates

**P0 ships courses only.** Reusable **course templates** (ACL, live link, sync, promote, deprecate) are **P1**.

| | **Course (P0)** | **Course template (P1)** |
|---|-----------------|---------------------------|
| **Purpose** | A specific offering families participate in | Reusable blueprint |
| **Required?** | Always — this is what parents and students are enrolled in | Optional — when content is reusable across terms |
| **Dates** | Optional **start date** and **end date** | None (units may still have optional dates) |
| **Roster** | **Yes** — each course has its own roster | None |
| **Materials** | Course units/materials | Template materials; linked copies + promote/sync |
| **Access control** | Course instructors + org RBAC | **view / edit / owner** per user |

**Creating a course (P0):**

1. **From scratch** — blank course; add units and materials manually.
2. **From another course** — copy that course’s **units and materials** into a **new independent course**. Does **not** copy roster, enrollments, important-now flags, or share links. **No live sync** between source and copy (template-style sync is **P1**).

**P1 (templates) — deferred:**

- Create course from a template; course stays linked (`template_id`)
- Instance content optionally **promoted** to the template
- Template edits **sync** only to unmodified course copies of that resource
- Template ACL (view / edit / owner); deprecate vs delete on template resources
- Promote a from-scratch course into a reusable template

**Versioning & deletes (P0, courses):**

- Course content is **versioned** — who changed it, when, and what the previous state was.
- Dangerous actions (delete, destructive edits) can be **reverted**.
- **Soft deletes** only — records stay in the database and can be restored.

### Template access controls (P1)

| Permission | Capabilities |
|------------|--------------|
| **Owner** | Full control — edit template, manage access, delete/archive. **Default: the creator.** |
| **Edit** | Modify template content and structure |
| **View** | See the template. **Instructors with view can create a course from it.** |

**Org admins** can see (and manage) **every template** in the organization.

<!-- "ACL" = who can view / edit / own a template. Same idea as permissions. -->

### File sharing (P0 minimum)

Minimum viable file sharing to replace **Microsoft / shared folders** for lesson materials.

| Capability | Description | Notes |
|------------|-------------|-------|
| **Upload files** | Attach files to course materials | Generous — keep types/sizes as open as possible |
| **Audio files** | Upload audio as materials; **in-app playback** | **P0.** Parents/instructors play without downloading first |
| **Video files** | Upload video as materials; **in-app video player** (play, scrub, fullscreen as browser allows) | **P0.** Hosted file playback — distinct from YouTube **embeds** |
| **Organize with materials** | Materials **reference** org-scoped `File` entities | Not a separate file browser in P0 — attach in course builder |
| **Share with parents** | Parents access files through shared course content / dashboard | Same access rules as other materials |
| **Template copy** | When templates ship (**P1**): course materials keep the **same `file_id`** — reference only, no blob clone | See [FILE_STORAGE.md](./FILE_STORAGE.md). **P0 course-from-course copy** also shares `file_id` (no blob clone) |
| **File versioning** | Each file replace stores a **new Storage blob** (prior blobs kept); revert restores a previous blob | Shared across all referrers unless forked |

**Media vs embeds:** YouTube (and similar) **URL embeds** remain P0 rich-document blocks. **Uploaded** audio/video use Storage + native players on the material/file view.

**Not in P0 minimum** (defer unless needed):

- Org-wide file drive separate from courses <!-- TBD -->
- Real-time collaborative editing <!-- out of scope -->
- Advanced video (captions editor, streaming transcode tiers, adaptive bitrate) <!-- TBD unless Storage/CDN forces a path -->

### Extreme shareability (P0)

Sharing is as core as planning. **Plan wright. Share wright.**

The smallest complete loop in P0: **create materials → print them (or send a link)**. Roster, parent invites, and enrollment make sharing *richer* — they are **not** required to get paper or a link out the door.

| Path | Who | What they do | Notes |
|------|-----|----------------|-------|
| **Print** | Anyone looking at materials they can access | One **Print** action → [PRINT](./pages/PRINT.md) (`…/print`) → **generated PDF preview** → Download or Print | **The P0 bar.** Must feel instant |
| **File sharing** | Instructors → enrolled parents | Files live on materials; parents open/download from the course / dashboard | Same access as other materials |
| **Resource link** | Instructor sends; parent opens | Link opens **that** material after login | Account required in P0 |
| **Parent dashboard** | Enrolled parent (or invited student email) | Up next + important now + this week; student tags; **Print** on a material or on this week for **active** students | Same print bar as creator |

**Print grain (P0):**

| Action | Prints | Where it lives |
|--------|--------|----------------|
| **Print** (on a material) | That material — in-app text/lesson plan in a print layout; files open in a print-ready view (PDF prints natively) | Creator course, parent dashboard, resource page |
| **Print unit** | The unit as one continuous packet (materials in order) | Creator course (unit), parent view of that unit |
| **Print this week** | This Sunday–Saturday week's dated materials (and important now, if any) for **active** students on the parent home | Parent dashboard |

**Not P0:** Print whole course.

Do **not** ship a separate “Export” product name in P0. Print *is* the path to paper and PDF. The `/print` screen **generates a PDF**, shows that file in an in-app viewer, and offers **Download** + **Print**.

**Print must be:**

- **Visible** — a **Print** control on the material, unit, and parent “this week” views. Not behind ··· or Settings
- **One step after the click** — Course Wright opens [PRINT](./pages/PRINT.md), generates the PDF, and shows the real pages. No format picker. Large unit / week packets may need a brief generate wait
- **Exact preview** — the viewer shows the **generated PDF** (not only an HTML approximation). What you see is what Download / Print produce
- **Readable on paper** — white page, black text, no app chrome in the PDF, no beige paper background, no wasted ink from decorative fills
- **Usable on a phone** — Download the `.pdf` and/or Print via the system sheet. Tech-averse parents should not need a computer
- **Usable without a roster** — a parent (or instructor) who created an org, built a course, and never added a student can still print
- **Preview stays available** — Download and Print remain on the screen after the PDF is ready

**Not in P0 print** (defer):

- Heavier branded / marketing-grade PDF templates (P0 = clean ink layout; richer packs later)
- **Print whole course** — **out of scope for initial release** (material / unit / this week only)
- Booklet imposition, duplex guides, or print-shop layouts
- Print without being signed in <!-- TBD: printable public/magic links later, same as magic-link viewing -->
- Naming the surface **Export** or using `/export` URLs — entry points stay **Print**
- Persisting generated PDFs / `PrintJob` rows — generate on the fly; no storage table in P0

### RBAC (P0)

| Role | Capabilities (high level) |
|------|---------------------------|
| **Owner** | Everything an **admin** can do, plus **billing** (P1). Creator of the org is the first owner. |
| **Admin** | Create/manage org (including **permalink slug**), invite other admins and instructors, **change admin/instructor roles**, **remove** admins/instructors (not the last owner/admin), org-wide roster, full org visibility. **Cannot** manage billing. (**P1:** see all templates.) |
| **Instructor** | Build/edit **courses**, create a course from scratch or **from another course**, **manage course roster**, co-teach, upload/share files (**versioned**), **print units/materials**, invite parents, mark important now. (**P1:** template ACL + create from template.) |
| **Parent** | View **and print** shared content and dashboard for their enrolled student(s) in **active** courses — only after invite + enrollment rules are satisfied. A parent who **created** an org can print their own materials with no roster |

<!-- Template access = who can view / edit / own a template. -->

### Parent access rules (P0)

**Decided:**

1. Parents are **invited by email** into the system.
2. A parent may access content by **creating an account or logging in** with the **same email** as the invite. The invite link takes them to sign up / log in. **P0: account required to view.** Magic links (view without an account) may come later.
3. Claiming a parent invite creates **parent membership** (and a student link). **Course access** still requires that student to be enrolled in a course with **`status = active`** and **`visibility = published`**. The invite itself does not open materials.

**Active course** = `Course.status = active`. Start/end dates are informational only.

**P0 if enrollment ends:** keep the **parent profile/account active**. What they can see later is deferred.

### Parent experience

**Design anchor:** Tech-averse parents who understand what's going on **the second they open a link or log in**.

| Entry path | Behavior |
|------------|----------|
| **Invite link** | Parent clicks email link → **sign up or log in** (account required in P0), then dashboard |
| **Account (same email)** | Parent signs up or logs in with invited email → system recognizes them as parent for linked student(s) in the org |

**Dashboard (home):**

| Layer | Phase | Content |
|-------|-------|---------|
| **Up next** | P0 | **Assigned next** (soonest assignment date on or after today) and **Due next** (soonest due date on or after today) among active students |
| **(C) Important now** | P0 | Instructor-flagged items needing attention (courses of active students) |
| **(A) This week** | P0 | Materials **assigned** this calendar week (Sun–Sat) **and/or due** this week — labels distinguish Assigned vs Due. **Print this week** is a first-class action |
| **(B) Summary** | P1 | System-drafted overview; instructor can edit |
| **Student tags** | P0 | When a parent has **more than one** student, tags at the top toggle who is active. Deselecting a student hides their work. One student (or a student viewing themselves) skips the tags. |

**Student view:** Same home as a parent, without multi-student tags/sections. Optional student email is invited with the parent claim path so that person only sees that one student. Dedicated student membership role remains **P2**.

**Staff parent view (P0):** Owners, admins, and instructors get a **Teacher** / **Parent view** control in org chrome (not parent-only users). **Parent view** uses the same parent chrome and read-only course / unit / material / print presentation. If that staff member has `parent_student_links` in the org, home is their real parent dashboard. If not, home is a preview (empty this-week, with a short explanation). Staff-only destinations (roster, course list, settings, material edit) return to org home while Parent view is on. Default is Teacher. Print packets omit the answer key in Parent view.

**Links parents can receive:**

| Link | What happens (P0) |
|------|-------------------|
| **Invite / dashboard** | Sign up or log in → parent home (this week + important now). Empty if not yet enrolled. |
| **Resource link** | Sign up or log in → **that specific material/file** — **Print** is obvious on that page |

Deep links still require an account in P0. Magic links (no account) may come later.

**Print on the parent side:** same one-tap bar as the creator. From a material, a unit, or **Print this week**. If a parent has to download a file, hunt for it, and figure out print, we failed.

### Units (P0)

Content on **courses** may use **units** for grouping (templates are **P1**). Materials do **not** require a unit.

| Rule | Detail |
|------|--------|
| **Units optional** | Units group materials when useful — not required |
| **Top-level materials** | Materials with **no unit** sit at the **course top level**, shown **above** the units list |
| **Unit dates** | Optional on a unit (`start_date` / `end_date` or a date range) |
| **Material dates** | Optional **assignment date** (`scheduled_date`) and optional **due date** (`due_date`) per material — unit and material dating both supported when a unit is set |
| **"This week" resolution** | A material appears on This week when its **assignment** date falls in the week (`scheduled_date`, else unit range) **and/or** its **`due_date`** falls in the week. Parent week is still **Sunday–Saturday**. Labels: **Assigned** vs **Due** |
| **Copy from course** | Units and materials (including top-level) copy into the new course; independent — no live sync in P0 |

**P0 homework:** dated materials (with `scheduled_date`, or in a dated unit). A material appears under parent "this week" when its effective date(s) fall in the current Sunday–Saturday week. There is **no separate assignment object in P0** — that's the next conversation.

### Materials & content creation

**Status:** content shape **decided**; rich-text store is **Lexical JSON**; **quiz is a block on a page**.

**Already decided (related):** Each **course** has its **own** roster (individuals via enrollment; Class is a batch preset). Create → print does **not** require a roster. **Templates are P1** — P0 authoring is on courses only.

#### Structure (decided)

```
Course
 ├── Material (optional unit)     ← top-level when unit_id is null (above units)
 ├── Unit
 │    └── Material (kind = page | link | file)
 └── …
```

| Rule | Detail |
|------|--------|
| **Units optional** | Materials may belong to a unit **or** sit at course top level (`unit_id` null) |
| **Top-level placement** | No-unit materials appear **above** the units list on the course |
| **Add material (v1)** | Three kinds: **page**, **link**, **file** (into a unit or top-level) |
| **Title + description** | **Every** material has a **title** and **description**, regardless of kind |
| **page** | A page of ordered **blocks** (rich text, video, quiz, …) |
| **link** | External URL (title + description + URL) |
| **file** | References an org-scoped **File** (title + description + upload / attach) |
| **Blocks** | Only on **page** materials |
| **Visibility** | **unpublished** (instructors/admins only) or **published** (enrolled parents; students when that role exists). New materials start unpublished |
| **P0 block kinds (on pages)** | **Rich text**, **video**, **quiz** — extensible later |
| **Database** | `materials.unit_id` **nullable**. `materials.kind` ∈ `page` · `link` · `file`. `materials.visibility` ∈ `published` · `unpublished`. Pages use `blocks` rows; link uses `url`; file uses `file_id` |

**Print:** Print by kind — page → blocks layout (quizzes print on the whole page: questions only for parents; staff see the answer key); link → title + URL/QR; file → title + print-ready/open. Print unit = materials in order. No quiz-block-only print in P0.

#### Phases for related kinds

| Kind | Phase | Intent |
|------|-------|--------|
| **page / link / file materials** | **P0 / v1** | “Add material” menu |
| **Rich text / video blocks on pages** | **P0** | Page composition |
| **Uploaded audio** | TBD | Not a v1 add-material kind |
| **Quizzes — author + print** | **P0** (product) | Block on a page — **not** in v1 add-material menu |
| **Quizzes — take online + autograde** | **P1** | |
| **Forms** | **in design** | |

#### Editor

Page materials use a **Lexical** WYSIWYG editor ([lexical.dev](https://lexical.dev/)). Canonical store for rich-text blocks is the Lexical editor state in `blocks.body.lexical`. Existing `body.markdown` still loads. Video URLs stay `video` blocks (insert from the editor toolbar). **Quizzes** are Lexical `quiz` nodes on the page (many allowed); correct answers live on the node for print (P0) and autograde (P1). Uploaded files, images, and audio/video can sit inside the Lexical document (no extra block kind). Instructors save from the page header; a new `material_versions` row is written only when saved placement or page content actually changed.

#### Closed workshop questions

1. ~~Page entity~~ → **page** materials are pages of blocks. No separate Page table required unless reuse demands it later.
2. ~~Reuse of the same page in multiple units~~ → **P0:** content is copied with course-from-course; no shared Page instance across units.
3. ~~Add material kinds (v1)~~ → **page · link · file**.
4. ~~Quiz~~ → **block on a page** (Lexical `quiz` node). Not a material kind. Many per page. Answers stored on the node.

#### Still open

1. **Video on a page:** URL embed vs uploaded file (or both).
2. **Uploaded audio** as a later block/material kind?
3. **Forms** — job to be done + who responds.

---

### Course rules (P0) & templates (P1)

**Courses (P0):**

- Created **from scratch** or **from another course** (copies units/materials; independent — no live sync).
- Optional **description** — short stable blurb for the offering (not the P1 auto-drafted **Summary**).
- Optional **location** — free text for where the offering meets (not a Class, not meeting times).
- Optional **subject / area** — free text catalog label (not a taxonomy).
- Optional **start date** and **end date**.
- Optional **grade-level metadata** — multiple grades and/or ranges per org grade scheme.
- Each course has its **own roster** (enrollments).
- **Multiple instructors** per course (co-teaching).
- Content is **versioned** and **soft-deleted**; changes can be reverted.
- **Active course:** `status = active` means the offering is running. Start/end dates are informational (optional), not access gates.
- **Published course:** `visibility = published` is what enrolled parents can see. New courses and copies start unpublished. Parents need **active + published** (plus enrollment) to see the course. Distinct from archive.

**Course templates (P1):**

- Reusable blueprints with materials and lesson plans.
- Per-template access: **owner**, **edit**, **view**. Creator = owner. Org admins see all templates. Instructors with **view** can create a course from it.
- No roster, no course start/end dates (units may have optional dates).
- Creating a course from a template copies content; the course **stays linked** (`template_id`).
- Instance content can be optionally **promoted** to the template; template edits **sync** only to unmodified course copies.
- Removing a template resource: **deprecate** (active courses untouched) or **delete** (soft-delete unmodified synced copies).
- A from-scratch course can later be **promoted to a template**.

### P0 user stories (draft)

- As an **org admin**, I want to **manage our student and staff roster** so that **I know who is in our org and which courses they're in**.
- As an **org owner**, I want to **create an organization and become its first owner** so that **we can start without waiting on anyone**.
- As an **org admin**, I want to **invite other admins by email** so that **they can claim a seat with their account**.
- As an **org admin**, I want to **change or remove admin and instructor roles** so that **staff access stays accurate** (without locking out the last owner or admin).
- As an **org owner or admin**, I want a **permalink URL for our organization** so that **we can share a stable link** — and a **clear warning** if I change the slug.
- As an **instructor**, I want to **upload lesson files and share them with parents** so that **families don't have to hunt through Microsoft folders**.
- As an **instructor**, I want to **replace a file and still revert to an earlier version** so that **mistakes with uploads aren't permanent**.
- As an **org owner or admin**, I want to **assign roles (owner, admin, instructor, parent)** so that **people only see what they should**.
- As an **instructor**, I want to **control who can view or edit my course templates** so that **shared blueprints stay consistent**. (**P1**)
- As an **instructor**, I want to **create a course from scratch or from another course** so that **I can reuse last term’s materials without maintaining a separate template in P0**.
- As an **instructor**, I want to **set a description, location, and subject on a course** so that **families and staff can tell offerings apart**.
- As an **instructor**, I want to **publish a course when I’m ready** so that **families don’t see a draft offering**.
- As an **instructor**, I want to **set start and end dates on a course** so that **families know when the offering runs**.
- As an **instructor**, I want to **add a student to my course** so that **they're automatically added to the org if they're new**.
- As an **instructor**, I want to **manage the roster for my course** so that **the right students are enrolled**.
- As an **instructor**, I want to **add material to my course and optionally add it to the template** so that **this term stays customized but next term can reuse what worked**. (**P1**)
- As an **instructor**, I want **template edits to update my course only when I haven't customized that resource** so that **shared updates land without wiping my local changes**. (**P1**)
- As an **instructor**, I want to **see who changed content and revert a bad edit or delete** so that **mistakes aren't permanent**.
- As an **instructor**, I want to **share course content with parents** so that **families know what to use at home**.
- As an **instructor**, I want to **promote a course I built from scratch into a template** so that **I can reuse it next term**. (**P1**)
- As an **instructor**, I want to **co-teach a course with another instructor** so that **we both can manage roster and materials**.
- As an **instructor**, I want to **organize materials in units with optional dates** so that **I can group work without forcing a calendar**.
- As an **instructor**, I want to **add a page, link, or file as a material** so that **I can mix lesson pages with handouts and URLs in a unit**.
- As an **instructor**, I want each **page material to be composed of blocks** (text, video, …) so that **I can build a lesson without a separate document type**.
- As an **admin or instructor**, I want to **group students into a Class** so that **I can manage cohorts separately from course content**.
- As an **instructor**, I want to **set a date on a material or on its unit** so that **parents see the right work under this week**.
- As an **instructor**, I want to **send a parent a link to a specific resource** so that **they don't have to hunt for it on the dashboard**.
- As a **parent**, I want to **open my dashboard and see this week's dated materials first** so that **I know exactly what my child needs without digging**.
- As a **parent creating materials**, I want to **print a worksheet or unit in one tap** so that **I can use it at the table without more software**.
- As a **parent receiving materials**, I want **Print on this week and on each material** so that **paper is as easy as reading the screen**.
- As an **instructor**, I want to **print a unit as a packet** so that **I can hand out this week's work without assembling files myself**.
- As an **instructor**, I want to **write a rich lesson page and print it** so that **families get a clear paper copy**.
- As an **instructor**, I want to **build a quiz, mark the correct answers, and print a blank copy** so that **I can hand it out on paper in P0**.
- As an **instructor**, I want to **upload audio or video and play it in the course** so that **families don't need a separate app or download dance**.
- As an **instructor**, I want to **tag a course with one or more grades or a grade range** so that **we know who the offering is for**.
- As an **instructor**, I want to **search across materials, files, and courses with filters** so that **I can find “where I put this resource” without browsing every unit**.
- As an **admin or instructor**, I want a **parent / family directory** so that **I can see households linked from the roster**.
- As a **parent**, I want to **belong to a family profile with our names** so that **the org sees our household together**.

---

## P1 — Important next

Progress tracking, auto-summaries, Course Wright billing orgs, and **course templates**.

| Feature | Description | Status | Notes |
|---------|-------------|--------|-------|
| **Course templates** | Reusable blueprints with per-template access controls | planned | Schema + `template_access` ready; UI deferred. view · edit · owner |
| **Template access** | Owner / edit / view; admins see all; view ⇒ create course from template | planned | Schema ready |
| **Create course from template** | Copy materials into a new linked course (`template_id`) | planned | Function job; not P0 |
| **Course instance overrides** | Add/edit materials on a linked course without automatically changing the template | planned | Lineage columns ready |
| **Promote to template** | Opt-in: add instance content to the linked template, or promote a from-scratch course | planned | Columns ready; no Edge Function/UI |
| **Template → course sync** | Template edits flow to linked course copies that still exist and have **not** been overridden | planned | Lineage columns only |
| **Deprecate vs. delete (template)** | Deprecate (active courses untouched) or delete (soft-deletes template + unmodified course copies) | planned | Soft-delete / deprecate fields ready |
| **Course summary (auto-draft)** | System drafts a parent-facing summary from current course work; instructor can edit | planned | Adds dashboard layer (B) |
| **Progress — grading** | Instructors record grades; visible to parents | planned | **Org-configurable** scale |
| **Progress — instructor notes** | Instructors share notes on student progress | planned | |
| **Progress — completion checklists** | Track what's done vs. outstanding | planned | |
| **Assignment objects** | Separate from dated unit materials | planned | **Next conversation** — not spec'd |
| **Quizzes (take online + autograde)** | Take quizzes in-app; score from P0-stored correct answers | planned | Authoring + print already P0 |
| **Forms** | Structured response collection | in design | Purpose + respondents TBD — see materials workshop |
| **Course Wright billing (orgs)** | We charge organizations so they can serve parents | planned | `billing/` SPA stub + owner-only placeholder on org settings. Packaging: per teacher or per course — **hypothesis**. Provider: **Stripe** *(hypothesis)* |
| **Notifications** | <!-- TBD --> | planned | Email likely |
| **Reporting** | <!-- TBD --> | planned | |
| **Designed PDF packets** | Richer branded PDF layouts beyond the P0 ink packet | planned | P0 already generates + previews a PDF; P1 = stronger brand / layout polish |

### P1 user stories (draft)

- As an **instructor**, I want to **create and share course templates** so that **reusable blueprints are available next term**.
- As an **instructor**, I want to **create a course from a template** so that **linked copies stay in sync until I customize them**.
- As an **instructor**, I want the **system to draft a summary of what's going on** so that **I can edit and publish it quickly**.
- As an **instructor**, I want to **record grades, notes, and completion status** so that **parents stay informed**.
- As a **parent**, I want to **see my student's progress** (grades, notes, checklists) so that **I know how they're doing**.
- As an **org owner**, I want to **pay Course Wright for our org** so that **parents and instructors can use the product**.
- As a **parent or student**, I want to **take a quiz online and get an autograded score** so that **we don't have to grade every item by hand**.

---

## P2 — Later (long term)

| Feature | Description | Status | Notes |
|---------|-------------|--------|-------|
| **Parent family management (cross-org)** | Parents manage household **across organizations** | planned | Extends P0 **org-scoped** Family / parent directory |
| **Student accounts** | Students log in to view assigned work | planned | Links a User account to an existing `student_profile` |
| **Student materials view** | Students access shared lesson materials | planned | Via linked account |
| **Quizzes** | Students take quizzes in-app | planned | Online take moved to **P1**; author + print is **P0** |
| **Orgs collecting payment from parents** | Tuition / class fees through Course Wright | planned | **Future** — not P0/P1 |
| **Integrations** | <!-- TBD --> | planned | |
| **Transcripts / records** | <!-- TBD --> | planned | |

---

## Explicitly out of scope (for now)

- **Native mobile apps** (iOS / Android) — web only
- **Student user accounts** — dedicated student role deferred to P2; P0 can invite optional student email via the parent claim path so that person sees that one student
- **Full parent family management across orgs** — deferred to P2 (org-scoped Family / parent directory is **P0**)
- **Orgs collecting tuition from parents** — future; Course Wright bills orgs first
- **Print whole course** — initial release is material / unit / this week only
- <!-- TBD -->

---

## Dependencies & decisions

| Decision | Status | Blocks |
|----------|--------|--------|
| Target org types: co-ops and micro-schools | **Decided** | Positioning, onboarding |
| P0 = course builder (**courses only**) + org management + roster management + RBAC + file sharing + extreme shareability (print + links) | **Decided** | All P0 features; **templates are P1** |
| Roster management in P0 | **Decided** | StudentProfile, Enrollment, ParentInvite |
| Student = student_profile, no account (P0/P1) | **Decided** | StudentProfile entity |
| First course enrollment creates student_profile in org | **Decided** | Enrollment workflow |
| Instructors add students to org via course enrollment | **Decided** | RBAC, roster UX |
| Student profile fields: name (required), parent email (optional), grade level (optional) | **Decided** | StudentProfile |
| Org chooses grade scheme (exact grade, range, or custom) | **Decided** | Org settings, StudentProfile.grade_level |
| Course grade metadata: multiple grades and/or ranges | **Decided** | Course (P0); CourseTemplate same model in **P1** |
| Advanced search is P0 (native, cross-facet, find resources) | **Decided** | Search UX + indexes; STACK Postgres-first hypothesis |
| Uploaded audio + video with in-app players | **Decided** | Storage files + players; distinct from YouTube embeds |
| Org-scoped Family + parent directory (P0) | **Decided** | Named group of student profiles (Class-mirror); parents derived from `parent_student_links`; directory is org list + sidebar |
| Family membership is not an access gate | **Decided** | Access stays enrollment + `parent_student_links` only. Do not treat `family_members.parent_user_id` as a gate (unused in P0 app). Link parent creates/reuses student links (`admin_invites` `role=parent` if no account); never enrollments. Parent may appear on two families via multiple student links |
| Cross-org parent family management | **Decided** | **P2** — not the same as P0 org Family |
| Active course = `status = active` (dates informational only) | **Decided** | Course.status — offering is running; not the same as publish |
| Course description, location, subject / area | **Decided** | Optional catalog fields; description ≠ P1 Summary; location ≠ Class; subject is free text |
| Course visibility published / unpublished | **Decided** | Unpublished = instructors/admins; published = enrolled parents (students later). New courses start unpublished. Parents need active + published |
| File sharing minimum in P0 | **Decided** | File upload, Material attachments, parent access |
| Product analytics: PostHog | **Decided** | STACK.md; HUMAN_NEEDED for project keys |
| P0 roles: owner, admin, instructor, parent | **Decided** | RBAC, Membership. Owner vs admin = billing (P1). |
| Admin manages accounts in P0 | **Decided** | Invite; **change admin ↔ instructor**; **remove** admins/instructors; cannot remove/demote last owner or admin |
| Org permalink slug on create | **Decided** | Unique `Organization.slug`; changing it warns that existing links break (no auto-redirect in P0) |
| Parents invited by email in P0 | **Decided** | ParentInvite, auth |
| Parent access via invite → **account required** to view (P0) | **Decided** | Magic links later |
| Parent org role requires student enrolled in course with status = active | **Decided** | Enrollment, StudentProfile, Membership. Viewing the course also requires `visibility = published` |
| Material visibility published / unpublished | **Decided** | Unpublished = instructors/admins; published = enrolled parents (students later) |
| Usability anchor: tech-averse parents | **Decided** | All parent UX |
| **Course templates are P1** (not in P0 UI) | **Decided** | P0 creates **courses** only; reuse via **create course from another course** |
| Create course from another course (copy units/materials; no roster; no live sync) | **Decided** | P0 course creation; Function candidate |
| Template copies all materials + lesson plans | **Decided** | **P1** — course creation from template |
| Course stays linked to its source template | **Decided** | **P1** — Course.template_id is a live link |
| Instance content can be optionally promoted to the template | **Decided** | **P1** — Material promote flow |
| Template edits sync to unmodified course copies of that resource only | **Decided** | **P1** — Material.is_overridden / lineage |
| Content versioning + revert | **Decided** | MaterialVersion (or equivalent) |
| File blob versioning + revert | **Decided** | Each replace keeps prior Storage blob; FileVersion (or equivalent) |
| File is org-scoped; materials reference `file_id`; copies reference only (no blob clone) | **Decided** | FILE_STORAGE.md; P0 course-from-course + P1 template→course |
| Soft deletes for content | **Decided** | deleted_at; no hard deletes |
| Template remove: deprecate vs. delete (configurable) | **Decided** | **P1** — Deprecate leaves courses alone; delete soft-deletes unmodified synced copies |
| On template delete, unmodified course copies soft-delete too | **Decided** | **P1** — Overridden copies left alone |
| Course does not require a template | **Decided** | Course creation UX (P0 has no templates) |
| Template access: view / edit / owner | **Decided** | **P1** — Creator = owner; org admins see all; view + instructor ⇒ can create course |
| Course can be promoted to a template later | **Decided** | **P1** — From-scratch → reusable |
| Content organized in units; unit dates optional | **Superseded** | Units optional; materials may be top-level |
| App entity PKs use **bigserial** / **bigint** (auto-increment) | **Decided** | FKs to app entities are `bigint`; `profiles` / auth stay `uuid` |
| Material dating: optional unit dates, optional material `scheduled_date` (assignment), optional `due_date` | **Decided** | Assignment date wins for assignment-week membership when set; else unit range if material has a unit; top-level needs `scheduled_date` for assignment-week. Materials also appear on This week when `due_date` falls in the week. UI labels Assigned vs Due |
| Multiple instructors per course | **Decided** | CourseInstructor |
| Calendar week = Sunday–Saturday | **Decided** | Parent dashboard |
| Parent must have an account to view (P0) | **Decided** | Invite → signup/login; magic links later |
| Parent profile stays active if enrollment ends (P0) | **Decided** | Defer visibility rules |
| File types/sizes generous | **Decided** | Keep open |
| Grade scheme presets: K–12 and Custom | **Decided** | Org onboarding |
| P1 grading scales org-configurable | **Decided** | P1 Grade |
| Success metric: MAUs | **Decided** | Vision |
| Tagline: Plan wright. Share wright. Course Wright. / Courses, done wright. | **Decided** | BRANDING.md |
| Anyone can create an org; creator is first owner | **Decided** | Org creation. Owners and admins manage org settings; only owners manage billing. |
| Multiple admins via email invite (claimable) | **Decided** | AdminInvite |
| Auth: email + Google | **Decided** | Supabase Auth + Google Cloud OAuth — STACK.md |
| P0 homework = dated materials in a unit | **Decided** | Parent "this week"; assignments next |
| Course Wright bills orgs (not parents) | **Decided** | SaaS; parent-pay is future |
| SaaS packaging per teacher or per course | **Hypothesis** | Not decided |
| Parents can receive a link to a specific resource | **Decided** | ShareLink to Material; auth required in P0 |
| Extreme shareability in P0 | **Decided** | Print + files + resource links; sharing is a core job |
| Print is P0 and must be super easy | **Decided** | One-tap Print → generated PDF preview → Download / Print; no export wizard |
| Print grain: material, unit, this week | **Decided** | **Print whole course out of scope for initial release** |
| Create → print does not require a roster | **Decided** | Empty org/course can still print |
| Print generates a real PDF and previews it in-app (P0) | **Decided** | Client-side PDF blob + viewer; not HTML-only `window.print()` as the primary path |
| Print routes: dedicated `/print` children (not `?print=1`, not `/export`) | **Decided** | Material / unit / `print-this-week` — [URLS.md](./URLS.md), [PRINT](./pages/PRINT.md) |
| Courses have optional start/end dates (informational) | **Decided** | Course entity |
| Each course has its own roster | **Decided** | Enrollment scoped to course |
| Instructors manage course roster | **Decided** | RBAC, roster UX |
| Rich document materials (MD and/or WYSIWYG, embeds, files on page) | **Superseded** | Replaced by **Material = page of blocks** |
| Material = page of ordered blocks (rich text, video, external link) | **Superseded** | Link is a **material kind**; pages use blocks (rich text, video, …) |
| Every material has **title** + **description** (all kinds) | **Decided** | page · link · file |
| Material = page of ordered blocks when kind=page | **Decided** | First-class block rows in DB |
| Class = org group of students, separate from Course | **Decided** | Course enrolls individuals; Class is a batch preset into enroll (not live) |
| Course roster UI: list-first + batch Enroll students | **Decided** | Multi-select + optional Class preset; batch create-and-enroll |
| Roster = page noun; Enroll/Unenroll = course verbs | **Decided** | BRANDING; class/org use Add/Remove |
| Quiz authoring + correct answers + print (blank + answer key) | **Decided** | **P0** — quiz is a **block on a page** (Lexical `quiz` node). Not a material kind. Many per page. Whole-page print; parent/student = questions only; staff = answer key. No roster required. No `/quiz` routes |
| Staff parent view (header toggle) | **Decided** | All staff (owner/admin/instructor). Real parent home if linked students; otherwise a preview. Hidden for parent-only users. Default Teacher. Parent view print omits answer key |
| Quiz online take + autograde | **Decided** | **P1** — uses answers stored in P0 |
| Page as composable entity (blocks) | **Decided** | Material is the page; no separate Page table required in P0 |
| Forms as a content kind | **In design** | Job-to-be-done + who responds TBD |
| Rich-text block canonical store (MD / JSON / HTML) | **Decided** | Lexical editor state JSON in `blocks.body.lexical`; WYSIWYG on material edit |
| Instance-only materials don't affect template | **Superseded** | **P1** — replaced by optional promote; N/A in P0 (no templates) |
| Course summary auto-draft (instructor edits) | **Decided** | P1 only |
| Billing in P1 | **Decided** | Course Wright → org (SaaS), not org → parent |
| Stack: Supabase + React + Tailwind + TanStack + Zustand + PostHog | **Decided** | STACK.md; PostgREST-first CRUD; Functions for complex ops; PostHog analytics |
| Screaming Architecture | **Decided** | ARCHITECTURE.md — domain folders scream product, not frameworks |
| Per-folder AGENTS.md | **Decided** | Root AGENTS.md indexes; local guides in each code folder |
| Bundler: Vite | **Decided** | STACK.md; SPA → dist → S3 |
| HUMAN_NEEDED.md for cloud blockers | **Decided** | Agents stub + document human steps; no fake secrets |
| File storage | **Decided** | Supabase Storage — STACK.md |
| Frontend hosting | **Decided** | AWS S3 + CloudFront — STACK.md |
| Infrastructure as code | **Decided** | Terraform + infra/tfvars — STACK.md |
| Custom domain | **Decided** | coursewright.com (prod); beta.coursewright.com (testing) |
| Migrations | **Decided** | `supabase db migrate` — STACK.md |
| Billing provider (P1) | **Hypothesis** | Stripe Billing — STACK.md; not P0 |
