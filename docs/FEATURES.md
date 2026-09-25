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

**Design anchor:** Anyone opening the **student experience** who **hates technology**. They open a link or the app and must understand **what's going on immediately** — which course, which student, what materials, what's due. No manuals, no LMS jargon, no hunting through menus. Linked parents inherit that same view.

**Instructor/admin bar:** A co-op volunteer or teaching parent completes core tasks **without training or documentation**.

**Shareability bar:** Sharing is a **P0 job**, not a later export. If someone built materials and wants them on paper or in someone else's hands, that path is **one obvious action** — not a wizard, not a download-then-open-then-print dance.

**Rules:**

- Flows are **short and obvious** — minimize steps, menus, and jargon
- **Student-facing** views are **simpler** than instructor views, not equal complexity
- Empty states and first-run experiences clearly answer **"what do I do next?"**
- Prefer one clear path over configurable complexity
- **Responsive web must work well on phones** — no native app, but people will open student links on mobile
- Avoid **Google Classroom-style density** — lighter, clearer, co-op-scaled
- **Print and share sit in the open** — never nested in overflow menus
- **Create → print does not require a roster** — no students, invites, or parent accounts needed to print what you made
- Prefer **student** language in product copy; say **parent** only when the feature is explicitly about parents (invites, parent email, parent role, parent–student links). Parents inherit student privileges.

If a feature can't be built intuitively for a tech-averse person on the student experience, **simplify the feature** before shipping it.

---

## P0 — Must have (short term)

**Audience:** Co-op and micro-school **admins**, **instructors (teachers)**, and **students** — including linked **parents** who inherit the student experience, and someone who creates materials themselves and just wants them **on paper**.

A person who signs up to make their own materials is the org **owner** (anyone can create an org). The **parent role** is for invited parents linked to a student; they see the **student** presentation. Both paths get the same print bar.

**Core value:** A **course builder** with **organizational management**, **roster management**, **RBAC**, **file sharing**, and **extreme shareability** (print + links), so admins can run the org, instructors build and share courses, and students can **use the materials** — on screen or printed — without extra software.

### P0 feature set

| Feature | Description | Status | Notes |
|---------|-------------|--------|-------|
| **Marketing site** | Public home, about, pricing, contact, privacy, terms, cookies, **help docs** | shipped | Home hero is the pre-ladder wording (“Courses, done wright.”). Public `/pricing` is a display-only ladder — Family free (2 students, 1 collaborator, 1 GB), Family Pro $6/mo · $60/yr, Microschool $72/mo · $720/yr, School $102/mo · $1,020/yr — yearly prices are 10× monthly and display lower whole-dollar effective monthly rates, default yearly, **Details** anchors to visible feature explanations plus **Contact us** on every card, no checkout. Billing remains the P1 Stripe stub. Contact emails live. Privacy, terms, and cookie policies live (PostHog + standard disclosures). Help at `/docs` (Getting started + nested topics; header/footer **Help**). SEO: build-time `sitemap.xml` / `robots.txt` (index `coursewright.com` only; disallow `/my/` + `/invite/`), OG/meta + JSON-LD in `index.html`, `site.webmanifest` (PWA pt 1: standalone + `/my` start URL), `llms.txt`, `.well-known/security.txt` |
| **Authentication** | Sign up, sign in | shipped | **Email (password or magic link) + Google** via **Supabase Auth**. Signup is Google or **email + password** and **signs the person in** (no extra login step). Login keeps password + magic-link. Session gates live |
| **Account settings** | Cross-org account page (`/my/settings`) | shipped | View + **edit display name** (`profiles.name`) + sign-out. Email is read-only (auth-owned). **Org-visible profiles** at `/my/<org-slug>/people/<user_id>` for other members (name, role, courses they teach / lead / are on). Installed-app **Notifications** (on or off for this device, or how to install). Avatar, Google link management, and other preferences still TBD |
| **Organizations** | Anyone can create an org; creator is first **owner**; org picker (`/my`) | shipped | Create + list + `/my/:orgSlug` home + org settings (identity, permalink, organization type incl. **family**, grade scheme, **school days**, **profile**, **branding**, **customizations**); **collapsible org sidebar**; staff home dashboard; **collaborators** invite email + copy link; **change/remove collaborators** in org settings. Billing remains P1 |
| **Org permalink** | Stable org URL (`slug`) created with the org | shipped | Create + settings change with break-links warning |
| **Org grade scheme** | Org chooses how grades work (exact / range / custom; presets K–12, Custom) | shipped | Defaults on create; owners/admins edit in org settings |
| **Org school days** | Org chooses which weekdays school operates | shipped | Default Mon–Fri. Owners/admins edit circle toggles in org settings; instructors read-only. Lesson-plan compose defaults to those days, with a dropdown to add another weekday |
| **Org profile** | Optional about, address, website, contact email, and phone | shipped | Owners/admins edit in org settings. Compact **About this organization** card on org home (staff + parent) when any field is set. Not a public `/about` page |
| **Admin invites** | Add other admins by email; those emails can be **claimed** by accounts | shipped | Invite owner/admin/instructor; **email via Resend** `organization-invite` (HN-015) plus copyable `/invite/<token>`; unsigned claim page names the invited email and prefills signup/login (HN-016) |
| **Student profiles** | Org-level student records; optional student login | shipped | Org roster create/edit + profile page; **multiple parent invites** (one pending token per email; siblings share it) + optional **student email** on a distinct **student** invite. Changing that email revokes a claimed student login; a pending invite is invalidated, replaced, and emailed to the new address. Parent invite email + copy-link on profile and course roster. Created when first added to a course or class |
| **Classes** | Org-scoped **group of students** — separate from a Course | shipped | Create class + batch add/remove members. Class is a **batch preset** into course enroll (not a live link). Owners/admins assign optional **class leads** (zero or more owners/admins/instructors) |
| **Roster management** | Manage org people: student profiles, **classes**, course enrollments, staff | shipped | List-first org / class / course roster with **batch select** enroll/add and **remove from the org roster** (also leaves classes and courses); multiple parent invites + optional student email; parent invite emails via Resend `organization-invite` (HN-015) plus copyable claim link |
| **RBAC** | Role-based access control across the org | in progress | Membership roles + RLS live; app switches student vs staff home. **Roles:** owner, admin, instructor, observer, parent, student. **Observer** is view-only staff chrome (org-wide read, no writes, no invites, no Teacher/Student toggle). Owner vs admin = billing. Instructors **see and edit courses they teach**; they may **view** a course they parent in (read-only). Owners/admins still see all courses. Staff change/remove is **membership-only** — family content stays enrollment-gated. **Staff Student view** in progress (header toggle). **Student** membership uses the same chrome as parent and is linked with `student_profiles.user_id` |
| **Admin account management** | Admins invite, **change roles**, and **remove** admins/instructors | shipped | Org settings updates `memberships` only (owners can promote to owner; admins change admin ↔ instructor ↔ **parent**; remove admin/instructor when they have no linked student). **Promote parent → staff** is a direct role change (no new invite). **Demote staff → parent** only when they have a `parent_student_links` row for a student in the org. Last owner/admin blocked in DB + UI. Does **not** add a staff-role gate on materials/roster RLS. Invite emails via Resend; copy-link remains |
| **Homework (P0)** | Dated materials in a unit — appear on student "this week" when dates fall in Sun–Sat | shipped | Optional **assignment date** (`scheduled_date`) and optional **due date** (`due_date`). Student home shows **Assigned next** / **Due next**; This week includes either date in range. **Not** a separate assignment type |
| **Course builder** | Create and organize **courses** within an org (no templates in P0) | shipped | Create, course home, units, materials (page/link/file), print/share chrome; collapsible course outline (units + materials tree) |
| **Courses (instances)** | Runnable offerings with dates and a roster — from scratch or **copied from another course** | shipped | Create from scratch + settings + roster. Copy via Function. Catalog: **description**, **location**, **subject / area**, optional **icon** on list cards. Course list: search, subject + grade filters, pagination. **Templates are P1** |
| **Create course from course** | Duplicate an existing course’s units/materials into a new independent course | shipped | Edge Function `create-course-from-course`; copy content only — **no roster**, **no live sync**, **no quiz attempts**. Copies units, materials, blocks, and quizzes (questions, choices, answer keys). Copies start unpublished |
| **Course visibility** | **Published / unpublished** controls whether families can see the course | shipped | Unpublished: amber warning + Publish. Published: green check badge by title; Unpublish lives in course settings. Distinct from `status` (active / archived) |
| **Co-teaching** | Multiple instructors per course | shipped | Course settings: owners/admins add co-teachers (RLS); instructors see the list |
| **Units** | Materials organized in **units**; each unit may have optional dates | shipped | Course home + unit page; **courses only** in P0 |
| **Rich materials** | **Add material** kinds: **page** / **link** / **file**; pages are ordered **blocks** | shipped | v1 kinds. Page editor is [Lexical](https://lexical.dev/) with a playground-style **icon** toolbar, **/** slash commands, and insert popups (table rows/columns, link, video, **audio**). Rich text stored as `body.lexical`. Toolbar: headings, lists, tables, quotes, links, video URLs, in-page file attachments, **audio** (upload or record), **quizzes**. Paste image → upload as in-page file; images render as clean pictures (no filename chrome). Material edit uses the same condensed header as resource/quiz edit (inline title, description dialog, desktop **Save & close**); page body fills the viewport |
| **Material visibility** | **Published / unpublished** controls who can see a material | shipped | Unpublished: amber warning + Publish. Published: green check badge by title; Unpublish at bottom of material view/edit. New materials start unpublished |
| **Quizzes (author + print)** | Create quizzes, mark correct answers, print blank (+ instructor answer key) | shipped | **Page quiz** = Lexical `quiz` node on a lesson page (not a material kind). Many per page. Print only: parent/student and staff **Student view** = questions; staff Teacher view = answer key. Multiple-choice choices use drawn SVG checkbox squares (blank for students; filled check on the answer key) — not `[ ]`/`[X]` text or Unicode bullets. No roster required. A separate **course quiz** (outline item) is the take-in-app path — see P1 |
| **File sharing** | Upload and attach files; share with students as part of course materials | shipped | File materials upload to Storage `org-files` with `files` / `file_versions`. PDFs: compact card + **Preview** fullscreen (no inline preview by default); images keep inline preview + Expand |
| **Audio & video files** | Video as a **block** on a material page; uploaded audio via **file** materials / in-page file attachments | shipped | Video **URL embed** in page blocks (upload vs URL still **TBD**). Uploaded audio uses a shared custom in-app player (play/pause, scrub, time, 1×/1.5×) on file materials and in-page files; uploaded video still uses native `<video>`. Instructors can **record a microphone clip** (under 5 minutes) when adding or replacing a file material, or via the page editor **Audio** insert (same recorder UI → in-page file attachment) |
| **Course grade levels** | Courses carry **grade metadata** — multiple grades and/or ranges | shipped | Editor on create + course settings. Course and catalog show grades in **one pill**, comma-separated, in the org’s grade-scheme order. Templates get the same model in **P1** |
| **Advanced search** | Native, easy, **cross-facet** search — “where do I have this resource?” | in progress | Staff chrome overlay (no `/search` route): Postgres FTS on `search_vector` for courses + materials; staff pages by title. Findability only (RLS). Deferred: facets, files, units, people, parent search, `ts_rank`, dedicated index |
| **Families / parent directory** | Named group of **student profiles**; parents appear via `parent_student_links`; org **parent directory** | shipped | Class-mirror members. Link parent creates/reuses student links (`admin_invites` `role=parent` if no account) and emails the Resend `organization-invite` event (HN-015). **Never enrollments.** `family_members.parent_user_id` unused in P0 app. Extra fields and merge/split still open. Copy-link claim lives on roster/profile. **SPA directory UI currently not routed** (schema + databridge remain) |
| **Print materials** | One-tap print of a material, a unit, or this week's work | shipped | [PRINT](./pages/PRINT.md): `@react-pdf/renderer` + in-app preview, Download / Print. This-week packet prints one student at a time (page break between students) and packs assignments onto a page when they fit. Whole-course print out of P0 |
| **Lesson materials & planning** | Unified storage for course content, files, and plans | shipped | Course builder authoring on courses |
| **Content versioning** | Versions of course content; who changed what; revert dangerous actions | shipped | Material edit **Version history** dialog: browse snapshots, preview, restore. File blob revert on file materials. Page/placement edits version only on Save when something changed |
| **Soft deletes** | Content is never hard-deleted | shipped | Remove/restore on units and materials (`deleted_at`) |
| **Parent invites (email)** | Invite parents by email to access shared content | shipped | One pending invite per org+email; more students attach without a second email. Emails Resend `organization-invite` (HN-015) and keeps copy `/invite/<token>` (same path as staff). Membership + links for all attached students on claim. Unrouted family directory attaches chosen students to one pending invite when linking an email with no account |
| **Parent access (link or account)** | Parent clicks invite link **or** signs up / logs in with the **same email** | shipped | Unsigned `/invite/<token>` shows the invited address; signup/login prefills it (HN-016). Course access still requires enrollment |
| **Parent org membership** | Parent becomes a parent in the org when they claim an invite | shipped | Membership created on claim; materials still gated on enrollment + published course |
| **Share resources with students** | Share course content and files with enrolled students (parents inherit) | shipped | Copy material URL (account required). Dedicated share-entry path still TBD |
| **Student home (this week)** | This week’s **calendar** (lesson plans + assigned/due chips), **Focus** (Important now + Coming up), **announcements**, student tags, **Print this week** | shipped | Student home; staff **Student view** uses the same chrome. Linked parents inherit this presentation. Current **announcements** (unread first, notification icon until opened; check icon once seen) sit above the week cards. Sidebar **Announcements** lists the same current notices and shows a red unread count. Main body is the current Sunday–Saturday week as **wrapping day cards** (empty days omitted). Focus rail (right on desktop, below on small screens) holds **Important now** and **Coming up**. Student tags still filter who is shown. **Print this week** prints published lesson plans first, then important now + dated materials, one student at a time |
| **Resource links** | Send a link that opens a **specific resource** (after login) | shipped | Copy signed-in material URL; `share_links` row recorded. Public entry path still TBD |
| **Instructor "important now"** | Flag items needing immediate student attention | shipped | Toggle on material; student home surfaces it |
| **Lesson plans** | Weekly course plan: optional week note, per-day notes, optional materials per day; **published / unpublished** | shipped | One plan per course per Sunday–Saturday week. Compose defaults to the org’s **school days**; staff can **Add another day** via a modal of remaining weekdays. Per-day **Link materials** opens an outline multi-select with search. Days with existing notes stay visible even if they are not school days. Default title `This week in <course title>`. New plans start unpublished. Families only see published plans. Replaces **bulletins** (no data migration). Course-from-course does **not** copy lesson plans. |
| **Calendar** | Month, week, and day view of assigned/due work and lesson plans, color-coded by course | shipped | Sidebar **Calendar** for staff and the student experience. Assigned = outline chip; due = filled chip. Items open the material, **quiz**, or lesson plan. Tapping a day (not an item) opens **day** view. Course colors from a small palette (`courses.color_key`) with a filterable legend. Week view shows lesson-plan text in seven columns; This week uses wrapping day cards and hides empty days. Quizzes use accepting-window wall dates (starts → Assigned, ends → Due) |
| **Events** | Calendar item for **one course**, **one or more classes**, or the **whole organization** (no course or class). Optional **location**. Optional end date and start/end times. Write-up page plus links to existing course materials | shipped | Not a `materials` row. Owners, admins, and instructors add it. An instructor can only attach a course they manage. Any teacher can make an organization event. **Link materials** opens a searchable multi-select modal (same pattern as lesson plans). Month and week show a title chip. Day view shows time and location when set. No hourly grid, repeat, or notification. Families see a course or class event when a linked student is in it, and every organization event |
| **Announcements** | One-way notice to one or more **courses**, **classes**, or **students** (same kind). Optional start/end dates control homepage visibility. Opening it marks it read and clears the notification icon. Families also have an **Announcements** list with a read-receipt icon once opened, and a red unread count on the sidebar. Optional **Send notification** emails families who already have an account and adds an Activity row for them. No reply thread | in progress | Distinct from **lesson plans** (those attach this week’s materials) and from **P1 discussions**. Org owners/admins can post any audience. Instructors can post for courses they teach, and for classes or students they can already manage on roster. Families see current announcements on home and `/announcements`. Opt-in email via Resend `announcement-notification` to claimed accounts only (same `RESEND_API_KEY` as HN-015). The same send also writes one Activity row per recipient. |
| **Staff Student view** | Owners, admins, and instructors switch most org pages to the student presentation | in progress | Header **Teacher** / **Student view**. Real this-week if they have linked students; otherwise a preview. Hidden for parent-role users (they always see student chrome). SPA + unit tests in; browser E2E against testing Auth blocked by email send rate limit |

### Roster management (P0)

Roster exists at **three** levels: **organization** (student profiles, staff), **class** (named group of students), and **course** (who participates in an offering).

**UI vocabulary:** staff and parent chrome label is **Students** (Classes is a tab under that page). Learner chrome label is **Progress**. Course verbs stay **Enroll** / **Unenroll**; class and org verbs stay **Add** / **Remove**. There is no top-level **Roster** or **Records** item. Batch select is the default add path.

| Capability | Who | Notes |
|------------|-----|-------|
| **Student profiles** | Admin, **instructor** | Org-level record for each student — **no user account required** |
| **Classes** | Admin, instructor | Named groups of student profiles — **not** a course; no materials |
| **Add student via course / class** | **Instructor** | First-time add creates `student_profile` in the org; **batch create** (paste names / multi-row) supported |
| **Course roster** | **Instructor** (their courses) | Enroll **individuals** (multi-select); optional **Class preset** checks that class’s members once |
| **Parent linkage** | Admin, instructor | Associate **one or more** parent emails with each student profile |
| **Parent invites** | Admin, instructor | Email a claim link from roster or student profile (Resend `organization-invite`; copy-link remains) |
| **Staff / instructor assignment** | Owner, admin | Assign instructors to courses (course roster + course settings); assign **class leads** (class roster, labeled Teachers) |
| **Admins** | Owner, admin | Multiple admins; invite by email (claimable) |
| **Billing (P1)** | Owner | Course Wright bills the org — admins cannot manage payment |

### Classes (P0)

A **Class** is an org-scoped **group of students**. It is **not** a Course.

| | **Class** | **Course** |
|---|-----------|------------|
| **Purpose** | Group students (e.g. “Wednesday cohort”, “Room A”) | Plan and share materials for an offering |
| **Materials / units** | None | Yes |
| **Members** | Student profiles | **Enrollment** → `student_profile` (individuals) |
| **Dates / grade metadata** | Name + members + optional **leads** | Optional start/end; optional grade levels |

**Decided:** Class and Course are separate concepts. Class list lives on the org roster; class roster is `/my/<org-slug>/classes/<class_id>`. Admins and instructors manage classes (same as the roster capability table).

**Decided (enrollment):**

1. A course enrolls **individuals** (`enrollment → student_profile`). A Class may be used as a **batch preset** when enrolling (one-shot copy of members into enrollments — **not** a live link).
2. Students may be in **multiple classes** and **multiple courses**.
3. Parent “this week” / access keys off **course enrollment** only; Class never grants materials, this-week, or print.
4. Class fields in P0: **name** + members + optional **leads** (owners/admins assign zero or more owners, admins, or instructors). Leads are notified in **Activity** when someone posts in a discussion for that class.

Keep **Course.enrollment → student_profile** as the access gate for parents.
### Org creation & admins (P0)

| Rule | Detail |
|------|--------|
| **Who can create an org** | **Anyone** (signed-in or as part of signup) |
| **First owner** | The person who creates the org — they can manage the org **and** (P1) billing |
| **Admins** | Same org management as owners (name, permalink, grade scheme, school days, profile, staff) except **billing**, **branding**, and **customizations** |
| **More admins** | Owner/any admin adds **emails**; those people **claim** the seat with an account on that email. Course Wright **emails** the invite (Resend `organization-invite`, HN-015) and still offers a copyable `/invite/<token>` link. The claim page names that email and prefills signup/login; pending requests also show after login |
| **Multiple admins** | Yes — no single-admin limit |
| **Change staff roles** | Owners and admins change the **exclusive** role (instructor, admin, or owner) for collaborators, including **parents** already in the org. Promoting a parent **keeps parent** (`is_parent` / `parent_student_links`) and adds the exclusive role. A newer exclusive role replaces the previous one. **Parent** and **student** are additive and are not chosen as replacements. **Students do not appear** in Collaborators and cannot be promoted there. Does **not** add a second content gate — families still see content via **enrollment** (and `parent_student_links` or `student_profiles.user_id`) |
| **Remove staff** | Owners and admins can **remove** the exclusive admin or instructor role (not the last owner/admin). If that person is also a parent or student, the membership **stays** as that additive role. Otherwise the membership ends. Suspending or removing a staff membership also drops their `course_instructors` rows. Does **not** rewrite materials/roster RLS |
| **Last owner/admin** | Cannot remove or demote the **last remaining owner or admin** (org lockout guard) |
| **Org permalink** | On create, generate a unique **`slug`** used as the org’s permalink URL. Owners and admins may change it later; the UI **must warn** that changing the slug **breaks existing links** (no automatic redirect required in P0) |
| **Branding** | **Owners only.** Optional small icon and one accent color used as that org’s primary color (buttons, links, sidebar). The color must be dark enough for white text. Admins do not edit it. See P1 **Org white labelling** |
| **Customizations** | **Owners only.** Turn optional product surfaces on or off for the organization: Discussions, Announcements, Resources, Lesson plans, Events, Calendar view. Off hides nav, routes, and compose entry points; existing data is kept. Admins see the settings read-only, without Save. Defaults: all on |

### Student profiles (P0)

Students are represented as **`student_profile`** records. A **student account** is optional: staff invite `student_email` with `admin_invites.role = student`, and claim sets `student_profiles.user_id`.

| Rule | Detail |
|------|--------|
| **Student role** | Membership `is_student` is additive and can sit on the same row as parent and as one exclusive role (owner, admin, or instructor). Claim links that one profile via `user_id` (not `parent_student_links`). One account per profile in an org. The exclusive role governs privileges |
| **Created on first enrollment** | When an instructor adds a student to a course and they don't exist in the org yet, a `student_profile` is created automatically |
| **Same student home** | A student account sees the parent presentation for that one profile (published courses they are enrolled in). Students are **not** promoted from Collaborators. A staff invite claim can add an exclusive role and keeps the student flag |
| **Email changes** | Changing `student_email` invalidates any pending student invite and emails a fresh invite to the new address. If the invite was already claimed, the profile’s `user_id` link is cleared and a student-only membership ends. A parent membership stays and `is_student` clears. An exclusive staff membership is kept and `is_student` clears |

**Fields:**

| Field | Required | Notes |
|-------|----------|-------|
| **Name** | Yes | That's the only required field |
| **Parent emails** | Optional | One or more. First email may be stored on create; more parents are invited from the student profile |
| **Student email** | Optional | Contact email for the student. Staff invite that address with a **student** claim (`role = student`), not a parent invite |
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

**Courses** carry **grade-level metadata** so instructors can find and filter offerings by who they're for — separate from student profile grade, and separate from org grading scores. (**Course templates** use the same model when templates ship in **P1**.)

| Rule | Detail |
|------|--------|
| **Required?** | Optional on a course, but when set must follow the org's **grade scheme** |
| **Multiple grades** | Yes — a course may target more than one discrete grade (e.g. 3rd **and** 4th) |
| **Ranges** | Yes — a course may use a band (e.g. K–2, 6–8) when the org scheme allows ranges |
| **Mix** | Multiple values and/or ranges are allowed together when the scheme supports them |
| **Display order** | Shown as one comma-separated pill, sorted in the org admin’s grade-scheme order (not selection order) |
| **Copy from course** | Grade metadata may be copied into the new course when creating from another course (editable after) |

This is **catalog metadata** (“what ages/grades is this course for?”). Student scores and report cards are **Progress — grading** (org grading scale). Do not store those on `grade_scheme` / `grade_labels`.

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

**This slice (staff chrome):** Overlay search uses generated `search_vector` GIN indexes via PostgREST `fts(english)` (`to_tsquery`, not `plainto_tsquery`) for **courses** and **materials**, so prefixes like `frac` match Fractions. Staff **pages** (Home / Courses / Students / Settings) match by title in the client. Staff only; no `/search` route; no Algolia/Elastic/side index. Hits are findability only — they do not grant access; enrollment / `parent_student_links` stay the gate.

**Deferred:** facets, files, units, roster people / families, page/block body text, `ts_rank`, parent search, dedicated `/search` route.

### Families & parent directory (P0, org-scoped)

**Access lock:** Family = named group of `student_profile`s (Class-mirror). Empty family is OK. Access stays course enrollment + `parent_student_links`. A family profile does **not** grant materials, this-week, or print.

Parents appear on a family **only** via existing `parent_student_links` to those students. Do **not** invent a family-membership access table, and do not treat `family_members.parent_user_id` as an access gate (column unused for P0 app writes). Linking a parent reuses or creates `parent_student_links` (and may save one pending `admin_invites` row with `role=parent`, attaching chosen students via `admin_invite_students`, if they have no account). **Never write enrollments** from this directory. A parent on two families is **yes by default** (via links to students in each).

| Concept | Detail |
|---------|--------|
| **Family** | Org-scoped **named group of student profiles** (same shape as a Class) |
| **Family profile** | Display **name** required in the directory; member **names** at minimum; **additional fields TBD** |
| **Parent directory** | Org list + sidebar of families — find a household without hunting the course roster |
| **How it forms** | Staff create a named family, then add existing or new student profiles (a student is in at most one family) |
| **Parents on a family** | Derived from `parent_student_links` to member students — not from family membership rows |
| **Link parent** | Create or reuse `parent_student_links` for the chosen student(s); if no account, one `admin_invites` `role=parent` with students attached via `admin_invite_students` |
| **Visibility** | Owners, admins, and instructors (Class-mirror). Parent-facing family profile is TBD |

**Not P0:** full parent-managed household **across organizations** — that stays **P2** ([Parent family management](#p2--later-long-term)). Invite emails use the same Resend `organization-invite` event as staff (HN-015). Copy-link claim is `/invite/<token>` from roster/profile (this directory, when routed, may insert a pending `admin_invites` row with `role=parent`).

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
2. **From another course** — copy that course’s **units and materials** into a **new independent course**. Does **not** copy roster, enrollments, important-now flags, share links, **lesson plans**, **announcements**, or **discussions**. **No live sync** between source and copy (template-style sync is **P1**).

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
| **Share with students** | Parents access files through shared course content / dashboard | Same access rules as other materials |
| **Template copy** | When templates ship (**P1**): course materials keep the **same `file_id`** — reference only, no blob clone | See [FILE_STORAGE.md](./FILE_STORAGE.md). **P0 course-from-course copy** also shares `file_id` (no blob clone) |
| **File versioning** | Each file replace stores a **new Storage blob** (prior blobs kept); revert restores a previous blob | Shared across all referrers unless forked |

**Media vs embeds:** YouTube (and similar) **URL embeds** remain P0 rich-document blocks. **Uploaded** audio uses Storage + a custom in-app player on the material/file view; uploaded video uses Storage + native `<video>`.

**Not in P0 minimum** (defer unless needed):

- Org-wide file drive separate from courses — **P1 Resources** (`src/resources/`) — shipped as nested folders + document / link / file; not a Microsoft-style file browser inside courses
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
| **Student home** | Enrolled parent (or invited student email) | Up next + important now + this week; student tags; **Print** on a material or on this week for **active** students | Same print bar as creator |

**Print grain (P0):**

| Action | Prints | Where it lives |
|--------|--------|----------------|
| **Print** (on a material) | That material — in-app text/lesson plan in a print layout; files open in a print-ready view (PDF prints natively) | Creator course, student home, resource page |
| **Print** (on a Resources document or file) | That org resource | [RESOURCE](./pages/RESOURCE.md) |
| **Print unit** | The unit as one continuous packet (materials in order) | Creator course (unit), parent view of that unit |
| **Print this week** | This Sunday–Saturday week's dated materials (and important now, if any) **plus published lesson plans** for **active** students on the student home — one student at a time, **that child’s lesson plans first**, then a page break | Student home |

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
| **Instructor** | Build/edit **courses they teach**, create a course from scratch or **from another course**, **manage that course’s roster**, co-teach, upload/share files (**versioned**), **print units/materials**, invite parents, mark important now. They do **not** see or edit other instructors’ courses. They **may view** a course they **parent** in (read-only). (**P1:** template ACL + create from template.) |
| **Observer** | Staff chrome and org-wide read (drafts, unpublished, answer keys, roster) with **no writes**. Owners and admins invite them. They do not invite, bill, brand, post in discussions (start or reply), or count as a last owner/admin. Additive parent still reaches linked-student reads only. Not the Teacher/Student view toggle. |
| **Parent** | View **and print** shared content and dashboard for their enrolled student(s) in **active** courses — only after invite + enrollment rules are satisfied. A parent who **created** an org can print their own materials with no roster |

<!-- Template access = who can view / edit / own a template. -->

### Parent access rules (P0)

**Decided:**

1. Parents are **invited by email** into the system.
2. A parent may access content by **creating an account or logging in** with the **same email** as the invite. The invite link opens `/invite/<token>` **unsigned**, names that address, and sends them to sign up / log in with it prefilled. **P0: account required to view.** Magic links (view without an account) may come later.
3. Claiming a parent invite creates **parent membership** and `parent_student_links` for every student attached to that invite. **Course access** still requires that student to be enrolled in a course with **`status = active`** and **`visibility = published`**. The invite itself does not open materials.

**Active course** = `Course.status = active`. Start/end dates are informational only.

**P0 if enrollment ends:** keep the **parent profile/account active**. What they can see later is deferred.

### Parent experience

**Design anchor:** Tech-averse parents who understand what's going on **the second they open a link or log in**.

| Entry path | Behavior |
|------------|----------|
| **Invite link** | Parent clicks email link → sees the invited address on `/invite/<token>` → **create account or sign in with that email** (account required in P0), then dashboard |
| **Account (same email)** | Parent signs up or logs in with invited email → system recognizes them as parent for linked student(s) in the org |

**Dashboard (home):**

| Layer | Phase | Content |
|-------|-------|---------|
| **Up next** | P0 | **Assigned next** (soonest assignment date on or after today) and **Due next** (soonest due date on or after today) among active students |
| **(C) Important now** | P0 | Instructor-flagged items needing attention (courses of active students) |
| **Lesson plans** | P0 | Teacher-composed weekly plan for a course (week note + optional per-day notes and materials). **Published / unpublished** like other content. Shown on This week’s calendar and the Calendar page. A published plan with only a week note is a whole-week note. **Print this week** includes each student’s published lesson-plan content first |
| **Announcements** | P0 | One-way notice to one or more courses, classes, or students (same kind). Optional start/end for homepage visibility. Unread notification until opened; parent list + sidebar unread badge. Optional email and Activity via **Send notification**. No reply thread |
| **Discussions** | P1 | Two-way thread for **one course** or **one class**. Title + audience. Families and staff who belong to that group can start a thread and post. One-level replies. Author or staff can mark **resolved**. Files, links to materials, and URLs on a post. Live updates while the app is open. Sidebar list + unread badge — **not** on This week home |
| **(A) This week** | P0 | Current Sunday–Saturday week as **wrapping day cards** (empty days omitted): lesson-plan text in each day, materials after a divider with that class, assigned = outline / due = filled. **Focus** rail: Important now + Coming up |
| **Calendar** | P0 | Sidebar month/week/day view of assigned and due work (and lesson plans on week/day view), color-coded by course with a filter legend. Calendar items are links; tapping a day opens day view. **Events** for that person’s course, classes, or the whole organization appear as their own chips |
| **Events** | P0 | One course, several classes, or the whole organization. Location optional. Optional end date and times (shown on day view). Write-up on the event page, plus links to course materials |
| **(B) Summary** | P1 | System-drafted overview; instructor can edit |
| **Student tags** | P0 | When a parent has **more than one** student, tags at the top toggle who is active. Deselecting a student hides their work. One student (or a student viewing themselves) skips the tags. |

**Student view:** Same home as a parent, for the one profile linked by `student_profiles.user_id`. Staff invite that email with a **student** invite (not the parent claim path).

**Staff parent view (P0):** Owners, admins, and instructors get a **Teacher** / **Student view** control in org chrome (not parent-role or student-role users). **Student view** uses the same student chrome and read-only course / unit / material / print presentation. If that staff member has `parent_student_links` in the org, home is their real student home. If they are also the linked student account (`user_id`), home is that one profile. If neither, home is a preview (empty this-week, with a short explanation). Staff-only destinations (roster, settings, material edit) return to org home while Student view is on. **Courses** list stays available (published courses only; no create). Default is Teacher. Print packets omit the answer key in Student view.

**Links parents can receive:**

| Link | What happens (P0) |
|------|-------------------|
| **Invite / dashboard** | Sign up or log in → student home (this week’s calendar + Focus + current announcements). Empty if not yet enrolled (class/student announcements can still show). |
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
| **"This week" resolution** | A material belongs on the week calendar when its **assignment** date falls in the week (`scheduled_date`, else unit range) **and/or** its **`due_date`** falls in the week. Parent week is still **Sunday–Saturday**. Labels: **Assigned** vs **Due**. Assigned chips are outlined; due chips are filled. Print this week is the full dated list **plus published lesson plans** (per student, lesson plans first) |
| **Copy from course** | Units and materials (including top-level) copy into the new course; independent — no live sync in P0 |

**P0 homework:** dated materials (with `scheduled_date`, or in a dated unit). A material belongs on the parent week calendar when its effective date(s) fall in the current Sunday–Saturday week. Assigned work is an **outline** chip; due work is a **filled** chip. **Print this week** includes the full dated week **and each student’s published lesson plans first**. There is **no separate assignment object in P0** — that's the next conversation.

**P0 lesson plans:** a course **Lesson plan** covers one Sunday–Saturday week. Instructors write an optional **week note**, optional notes for each day, and may **link materials** for each day (same course) via an outline multi-select with search. The compose form defaults to the org’s **school days**; staff can add another weekday from a modal of remaining days. Days that already have a note or materials stay on the form even if they are not school days. New plans start **unpublished**; families only see **published** plans (same publish controls as materials). A published plan with only a week note is a whole-week note for families. Attaching a material to a day does **not** change that material’s assignment or due date. Soft-delete to take it down. Unpublished materials attached to a plan are omitted for families (same as elsewhere). Course-from-course copy does **not** copy lesson plans (instance communication, like important now). This is **in-app**, not email. **Bulletins** are removed.

**P0 announcements:** an **Announcement** is a **one-way** notice (title + optional body) aimed at one audience kind: **course(s)**, **class(es)**, or **student(s)** — one or more targets of that kind. It is **not** a lesson plan (no attached materials) and **not** a discussion (no reply thread — **P1 Discussions**). Optional **start date** and **end date**: if set, families see it on home (and the parent **Announcements** list) while today is in that window (inclusive); if omitted, it stays current until staff remove it. Opening the notice marks it **read** for that person, removes the **notification icon**, shows a **read receipt** on the list, and clears that item from the sidebar unread badge. Parents of a matching student (and that student, when they sign in with a student account) see it. **Who can post:** org **owners and admins** (any audience in the org); **instructors** for courses they teach, or for a class / student they can already manage on the roster. Soft-delete to take it down. Course-from-course copy does **not** copy announcements. Staff may opt in to **Send notification**, which emails families who already have an account (Resend `announcement-notification`) and writes one **Activity** row per recipient. A later send updates that row instead of stacking. Pending invites are not mailed or pinged. The notice still saves if email fails. Sidebar unread stays separate and still appears for every unseen notice. Broader P1 Notifications (lesson plans, etc.) stay separate.

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
| **Add material (v1)** | Three kinds: **page**, **link**, **file** (UI adds into a **unit**; leftover `unit_id` null rows still show at course top level) |
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
| **Uploaded audio** | **P0** | Not a v1 add-material kind — upload as **file** material or in-page file attachment; custom in-app player |
| **Quizzes — author + print** | **P0** (product) | Block on a page — **not** in v1 add-material menu |
| **Quizzes — take in the app** | **P1** | Course outline item. Page quiz blocks stay print-only |
| **Forms** | **in design** | |

#### Editor

Page materials use a **Lexical** WYSIWYG editor ([lexical.dev](https://lexical.dev/), playground-style icon toolbar). Canonical store for rich-text blocks is the Lexical editor state in `blocks.body.lexical`. Existing `body.markdown` still loads. Insert **table / link / video / audio** through popups (table asks for rows and columns; audio asks for an upload or microphone recording). Type **`/`** for Notion-like slash commands (`/3x4` inserts a table). Markdown shortcuts (`#`, `-`, `1.`, `>`, `---`) still apply. Video URLs stay `video` blocks (insert from the editor). **Page quizzes** are Lexical `quiz` nodes on the page (many allowed); correct answers live on the node for print. Taking a quiz in the app is a separate course quiz. Uploaded files, images, and audio/video can sit inside the Lexical document (no extra block kind). Instructors save from the page header; a new `material_versions` row is written only when saved placement or page content actually changed.

#### Closed workshop questions

1. ~~Page entity~~ → **page** materials are pages of blocks. No separate Page table required unless reuse demands it later.
2. ~~Reuse of the same page in multiple units~~ → **P0:** content is copied with course-from-course; no shared Page instance across units.
3. ~~Add material kinds (v1)~~ → **page · link · file**.
4. ~~Quiz as a material kind~~ → a **page quiz** is a Lexical `quiz` node. Not a material kind. The take-in-app **Quiz** is a course outline item (P1), not a page block.

#### Still open

1. **Video on a page:** URL embed vs uploaded file (or both).
2. ~~**Uploaded audio** as a later block/material kind?~~ → **No** — file material or in-page file attachment only; custom in-app player.
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
- As an **instructor**, I want to **write a lesson plan for a school week and attach materials to each day** so that **families see this week’s plan in one place**.
- As a **parent or student**, I want to **see this week’s calendar with the teacher’s plan and the materials underneath** so that **I know what to open without searching the course**.
- As an **org owner or instructor**, I want to **post an announcement to one or more courses, classes, or students** so that **the right families see a one-way notice without a discussion thread**.
- As a **parent or student**, I want **current announcements on home and in Announcements, with a notification until I open one** so that **I know there is something new without hunting**.
- As a **parent**, I want to **open my dashboard and see this week's calendar (and what’s due) first** so that **I know exactly what my child needs**.
- As a **parent with more than one student**, I want **tags to hide a child** so that **I don’t mix up their courses**.
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

Progress tracking, auto-summaries, Course Wright billing orgs, **course templates**, **Resources**, and **discussions**.

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
| **Progress — grading** | Instructors record grades; visible to parents | shipped | Org grading scale (`none` default, letter, or pass/fail) is separate from the age-level grade scheme. Students hub for staff and parents; Progress for learners. Course gradebook finals are an unweighted mean of locked quiz percents and locked gradable material percents, plus a teacher override. Report cards are draft → submit, one at a time, with email enqueue. `src/grading/` |
| **Progress — instructor notes** | Instructors share notes on student progress | planned | |
| **Progress — completion checklists** | Track what's done vs. outstanding | planned | |
| **Assignment objects** | Separate from dated unit materials | planned | **Next conversation** — not spec'd |
| **Material submissions** | A material can accept files turned in by a student (parents on their behalf) | shipped | Accept submissions, allowed file groups, submissions allowed (1–10, default 2), multiple files per turn-in, "<Parent name> on behalf of <child name>" (student self-turn-in uses their name), due time default 11:59 PM. **Gradable** (default off) sets possible points (default 10, fractions allowed) and counts a teacher grade in the gradebook. Off means feedback only, and the submission stays out of the gradebook. Staff grade one submission at a time (**Grade next**, **Save and next**), like a quiz. Submitted files: **Open** in a fullscreen portal when the browser can render them (PDF / image / audio / video / txt); otherwise Download only. Not an assignment object and not a quiz attempt. `src/submissions/` |
| **Quizzes (take in the app or print)** | A course quiz families take when Accept entries is on, or print when it is off | shipped | Outline item on a unit, separate from a page quiz block. `src/quizzes/`. See **Quizzes** below |
| **Resources** | Org-scoped nested folders + document / link / file (Lexical + print). Folder and item access: **parents can see** and **students can see** are separate, plus per-person read/write. Publish/unpublish. Bulk drag-drop upload with progress. Multi-select to publish, move, remove, print together, or download files (zip when more than one). Independent of course enrollment | shipped | P1a. Forms (P1b) stay a later item type. Not `materials` rows. `src/resources/` |
| **Forms** | Structured response collection | in design | P1b inside Resources — not a second nav |
| **Course Wright billing (orgs)** | We charge organizations so they can serve parents | planned | `billing/` SPA stub + owner-only placeholder on org settings. Public `/pricing` lists Family, Family Pro, Microschool, and School for planning only (**Contact us**; no checkout). In-app packaging and **Stripe** checkout remain unbuilt. |
| **Org white labelling** | Owners upload a small icon and set one accent color used as that org’s primary color | shipped | Buttons, links, and the sidebar use the accent. Login, marketing, account home, email, and print stay Course Wright. Color must pass WCAG AA for white text and for text on paper. `organization_branding` + public `org-brand` bucket. Owners only write. The icon file and `organization_icons` path are public so a future invite can show the picture without a membership. Accent stays member-only |
| **Org feature customizations** | Owners turn optional surfaces on or off: Discussions, Announcements, Resources, Lesson plans, Events, Calendar view | shipped | Org settings **Customizations** tab. `organization_features` (owner writes; members read). Missing row = all on. Off hides sidebar items, routes, and compose buttons; does not delete data. Non-owners see the tab read-only, without Save |
| **Discussions** | Two-way thread for **one course** or **one class**. Title + who it is for. Staff and families in that group can start a thread and everyone on it can post. Flat conversation with optional **Quote** (Teams-style block in the message body). Composer is **plain text** by default; **T** turns on **Lexical** rich text. The person who started it, or staff who can see it, can mark it **resolved**. Posts can attach **files**, **links to course materials**, and **URLs**. While the app is open, new posts and resolved state appear without a refresh (**Supabase Realtime**). Distinct from **announcements** | in progress | Flat thread + quote-in-body + plain/Lexical composer (`20260922000003_discussion_quotes.sql`). Families start a discussion only for a **course their child is enrolled in** (active + published) or a **class their child is in**. Staff: owners/admins any course/class in the org; instructors for courses they teach and classes they can already manage on the roster. Invited student emails use the parent claim path. No email in this slice. Ad-hoc student-group audience later. Observers can read a thread and cannot start or reply, including when they are also a parent. |
| **Notifications** | In-app **Activity** list of events that need a person’s attention. Discussion posts notify **course instructors** or **class leads**, plus anyone who **started** the thread or **posted** in it. **@mentions** notify that person if they can see the thread. Staff starting a discussion can opt in to **Notify everyone** on the thread. Announcement **Send notification** also writes Activity for claimed families. A saved quiz grade or course final override writes Activity for that student’s account and linked parents (no email). A report card writes Activity on submit. Clicking a row marks it read and opens the activity. The installed app can show the same activity as a device notification | shipped | Stored `notifications` rows (ack = `read_at`). One discussion Activity row per person per discussion (later posts update that row; an @mention upgrades it to `discussion_mention` instead of stacking a second row — e.g. class lead + @mention). One **announcement** row per person per notice (a later send updates it). Rows show a type icon + headline (e.g. **New discussion: … in …** / **Mentioned in …** / **Announcement: … in …**), not a read-receipt checkmark. Header **bell** (right of the avatar) with unread badge; dropdown previews the three newest unread or **You're all caught up!**, plus **View all activity**. Announcement opt-in email stays **Send notification** (same toggle also writes Activity). Discussion thread unread badge and announcement sidebar unread stay separate. Installed PWA (home screen or installed window) can turn on device notifications for these rows; a browser tab does not. Tap opens the item and marks that row read. VAPID and webhook secrets are **HN-018** |
| **Loading mark** | Shared animated **CW** loading state for pages, with optional “what’s loading” text | shipped | `PageLoading` in `src/ui/`; honors `prefers-reduced-motion` |
| **Product feedback** | **Send feedback** in the account menu → form with name / email / org filled in | shipped | `/my/feedback` and `/my/<org-slug>/feedback`. Inserts `feedback` rows via PostgREST (no email) |
| **Record audio snippet** | When adding (or replacing) a **file** material, or inserting **Audio** on a **page**, record a clip under 5 minutes with the device microphone | shipped | Still a Storage **file** (file material or in-page `file` node) — not a new kind. Browser `MediaRecorder`; upload via existing Storage path. Page insert uses the same recorder UI in a popup |
| **PWA (pt 1)** | Installable web app: manifest `display: standalone`, icons, start URL `/my`, service worker | shipped | Network-first navigations. The service worker also shows Activity push. No offline course cache yet |
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
- As a **parent**, I want to **start a discussion for a course or class my child is in** so that **other families and teachers can talk in one place**.
- As an **instructor or admin**, I want to **start a discussion for a course I teach or a class I manage** so that **families can ask and answer together**.
- As a **parent or instructor**, I want to **quote a message and attach a file, a material, or a link** so that **we can share the worksheet or page we are talking about**.
- As the **person who started a discussion**, or as **staff**, I want to **mark it resolved** so that **families can see the question is settled**.
- As anyone **looking at discussions in the app**, I want **new posts to show up without refreshing** so that **I don't miss a message that is happening now**.
- As an **owner or admin**, I want to **assign one or more class leads** so that **those teachers are notified when someone posts in that class’s discussions**.
- As a **course instructor or class lead**, I want **Activity** so that **I can open a discussion post without hunting**.
- As a **parent or instructor** with Course Wright installed, I want a **notification on my device** when Activity updates so that **I see it without the app open**.
- As a **teacher starting a discussion**, I want to **notify everyone on the thread** so that **families see it in Activity**.
- As anyone **using Course Wright**, I want to **send feedback from my account menu** so that **I can say how to make it better without hunting for an email**.
- As an **instructor**, I want to **record a short audio clip when I add a file or insert audio on a page** so that **I don’t need a separate recorder app**.
- As an **owner, admin, or instructor**, I want **Resources folders for documents, links, and files** so that **handouts that aren’t tied to a course still live in Course Wright**.
- As an **instructor**, I want to **drop several files into a folder and rename them after** so that **I don’t upload one handout at a time**.
- As a **parent**, I want **Resources in the sidebar when something is shared with me** so that **I can open a handbook without being enrolled in a course**.
- As an **instructor**, I want to **publish a folder or item to all parents, or to one person** so that **I can keep drafts private and share the rest**.

### Resources (P1a)

**Resources** is an org library — nested **folders** plus **document** / **link** / **file** items. It is **not** course **materials** (no enrollment gate, no This week dates). **Forms** are P1b.

**Who can create:** owners, admins, and instructors. **Item `created_by`** is always an editor. Explicit **write** grants can add a parent (or other member) as an editor of that folder or item.

**Publish:** unpublished items are editors-only. Published items follow effective ACL (folder inherit walk, then item override).

**Browse:** check rows to publish, unpublish, move, remove, print (one packet), or download. One file downloads directly; several files download as a zip. Folders in the selection move or remove with the rest — publish, print, and download apply to selected items only. Parents and students see a shared item at the Resources root when they can open it and its folder is one they cannot open (including a legacy item shared with both audiences inside a staff-only folder). A folder they can open whose parent they cannot is listed there too. Staff still see the real folder tree. Sharing the item does not share that folder and does not require moving the item to root.

**Access:** **Parents can see** and **Students can see** are separate. Org staff can always edit. **Specific parents** and **specific students** can be **Can view** or **Can edit**, and that permission can be changed later. Manage access uses a Parents tab and a Students tab. Small cards at the bottom name each audience that can open it. Student profiles are not grantees — grants are org memberships.

**Nav:** staff always see **Resources** (between Courses and Roster). Parents and students see it when they can open at least one item.

### Discussions (P1)

A **Discussion** is a **two-way** thread (title + posts) aimed at **one course** or **one class**. It is **not** an announcement (those stay one-way, no replies) and **not** a lesson plan.

**Audience (this slice):** exactly **one** target of one kind — `course` or `class`. A class already is the named group of students (and therefore their parents). An ad-hoc list of students (announcement-style `student` audience) is **later**.

**Who is on the thread:** org **staff** who can see it, **parents** of matching students, and **student accounts** linked to those profiles. Course threads: enrolled families of that **active + published** course, plus that course’s instructors (and other org staff). Class threads: parents and the student account of class members (class membership is enough — no course enrollment required), plus org staff. Everyone who can see the thread can **post**.

**Who can start one:**

| Actor | Can start for |
|-------|----------------|
| **Parent** or **student account** | A **course their linked student is enrolled in** (active + published), or a **class their linked student is in**. A student account uses their own profile |
| **Instructor** | Courses they teach; classes they can already manage on the roster |
| **Owner / admin** | Any course or class in the org |

Staff **Student view** uses the student rules (create only if they have linked students). Teacher view uses the staff rules. Staff Student view without linked students is an empty preview — no compose.

**Thread shape:** required **title**; required **opening post** (plain text and/or rich text and/or at least one attachment). Posts are a **flat** timeline (oldest first). **Quote** on any non-removed message adds a Teams-style cite into the **new message body** (not a nested reply, not separate DB columns). Composer is **plain text** by default; **T** switches that compose session to the same **Lexical** editor chrome as page materials (icon toolbar, `/` slash commands, floating format, tables/links/video/divider — **no quiz**, no in-page file upload; message attachments stay on the composer **file** / **+** controls). Typing **@** opens a picker of people who can currently see the thread (not the author); choosing a name (click or Enter) replaces the query with a mention **pill**. Marking **resolved** does **not** lock the thread. **Resolved** / **Open** is a status badge (resolved shows a checkmark). The person who **started** the discussion, or **staff** who can see it, can mark resolved and unmark it. Title is not edited after create in this slice. **Remove** (soft-delete) a discussion: staff only. A poster may remove **their own** post (soft-delete); staff may remove any post. A poster may **edit** the body of **their own** non-removed post (in-place). Adding an **@mention** on edit also notifies that person (a mention already stored on the post is not pinged again). Removed posts show a short “This message was removed.” Quoted text already in later bodies stays. Audience cannot change after create.

**Attachments** on a post (any combination):

| Kind | What |
|------|------|
| **File** | Upload to org `File` / Storage (`org-files`) — same players as materials for audio/video |
| **Material** | Link a **published** material the poster can already view |
| **Link** | External URL + optional label |

**Unread:** per signed-in person (`DiscussionRead.last_read_at`). Opening the thread (and staying on it as live posts arrive) marks it read for that person. Sidebar **Discussions** shows a red count of unread threads. Unread is **not** shown as a stack of cards on This week home — keep home for the week calendar + announcements.

**Activity notifications:** a new post writes `Notification` rows. **Course** threads notify that course’s **instructors**. **Class** threads notify that class’s **leads**. Anyone who **started** the thread or **already posted** in it is also notified. One discussion Activity item per person per discussion — further posts on the same thread update that row (they do not stack). An **@mention** upgrades that same row to `discussion_mention` (so a class lead who is also @mentioned gets one ping, not two), including when the author adds one while editing. The author is never notified of their own post. When **staff** (Teacher view) start a discussion, **Notify everyone** (off by default) also notifies everyone who can currently see the thread (org staff + qualifying parents). Clicking an Activity row marks it **read** and opens the post. Opening the thread also acks that person’s **new post** notifications for the thread. An **@mention** stays unread until they click it in Activity (or the header preview).

**Realtime:** while the SPA is open, **Supabase Realtime** (Postgres changes, RLS still applies) updates the open thread (posts, quotes, attachments, answered, removes), the open list (new threads, last activity, answered), the sidebar unread-thread count, the header Activity bell, and **Activity**. No typing indicators in this slice. Closed tab / email / push is **not** this feature.

**Copy / search:** course-from-course does **not** copy discussions. Discussion titles are not in P0 chrome search in this slice.

**Usability:** student chrome stays simpler than staff. Sentence case. No “forum” / LMS jargon. **New discussion**, **Quote**, **Mark as resolved**. **Notify everyone** only on staff compose. **@** to mention someone on the thread.

### Activity / notifications (P1)

**Activity** is the stored-notification list for the signed-in person. A **bell** in the org header (right of the avatar) shows a red unread count. Distinct from announcement unread icons and from the Discussions unread-thread badge.

| Rule | Detail |
|------|--------|
| **Who is notified of a discussion post** | **Course instructors** for a course thread; **class leads** for a class thread; anyone who **started** the thread or **posted** in it. **@mentions** also notify that person if they can see the thread. Never the author. One **new post** notification per person per discussion. |
| **Notify everyone** | Staff Teacher view, on **create** only, off by default. Opening post also notifies everyone who can see the thread. |
| **@mention** | Typing **@** in the composer (new post or edit) opens a picker of people on the thread. Choosing a name (click or Enter) replaces the query with a mention pill. Mentions are stored on the message and write (or upgrade) that person’s one discussion Activity row to `discussion_mention` — including when they would also get a class-lead / instructor post ping. Existing mention rows are not duplicated on edit. |
| **Header preview** | Opening the bell shows the **three newest unread**. If more remain, **+ N unread**. No unread: **You're all caught up!** Either way, **View all activity** opens the full list. |
| **Announcement** | Staff **Send notification** writes one Activity row per claimed family account on that notice (never the sender). A later send updates that row. Opening the announcement acks it. Sidebar unread is separate and still shows for notices that were not sent this way. |
| **List copy** | Headline names the activity (discussion, mention, or announcement) and the course/class; preview under it; type icon by kind. Unread is card emphasis only — no read-receipt checkmark. |
| **Ack** | Clicking the Activity row (or a header preview row) sets `read_at`. Opening the linked discussion also marks matching **new post** notifications read for that person. Opening the announcement marks matching **announcement** notifications read. **@mentions** stay unread until clicked. A device-notification tap marks **that** row read, including an @mention. |
| **Device notification** | Installed PWA only (home screen or installed window, not a browser tab). The org shell asks once: **Turn on notifications** / **Not now**. Account settings can turn them on or off for this device, explains how to install, and explains a blocked permission. An unread Activity insert or update (later post, mention, or another announcement send) sends a push with the same headline and preview. The header bell still updates over Realtime while the app is open. |
| **Not this slice** | Alerts for other object types (e.g. added to a course) beyond the Activity rows above. Announcement email stays on **Send notification**. |

---

### Quizzes (take in the app or print)

A **Quiz** is a course outline item on a unit. A Lexical quiz on a lesson page stays a printable side element.

| Rule | Detail |
|------|--------|
| **Who sees it** | Staff who can manage the course. Families when the course is active and published, the quiz is published, and their student is enrolled. New quizzes start unpublished |
| **Accepting window** | **Accept entries** (default off). Off → print and download only, no Submit. On with no start/end → take whenever the quiz is published. On with a start and/or end → submit only while now is inside the bounds that are set. At or after the end is rejected in the database. Picking a start date defaults the time to midnight; picking an until date defaults the time to 11:59 PM (existing times are kept) |
| **Print** | Anyone who can open the quiz can print it, including during and after the window |
| **Answer key** | Teacher view always. **Share answer key with parents** (default off) shows it to parents whenever the quiz is published. A student login (account email matches that student’s `student_email`) never sees it. Staff **Student view** follows the parent rule |
| **Who submitted** | A parent entry is **"<Parent name> on behalf of <child name>"**. A student login is the student name only. A parent with more than one enrolled child picks the student first |
| **Attempts** | **Allow more than one attempt** (default off). Off = one submitted entry per student. On = more entries until the window closes. Every entry is kept. The family sees the latest. Nothing is stored until Submit |
| **Points** | Each question defaults to **1** possible point. The teacher can change it (including fractions such as **4.5**). The quiz edit page shows the total possible points in a side panel on desktop |
| **Score** | A correct number answer earns the question’s full points (`3.5`, `3.50`, and `7/2` match). Multiple choice splits the points evenly across the correct choices and subtracts that same share for each wrong choice, never below 0. A fully correct set still earns the full points. Matching splits the points evenly across the pairs: each correct pair earns its share, and a wrong pair does not subtract. Short answer and long answer are stored and are not autograded; the teacher assigns their points. **Show results immediately** (default off) stores that first pass on the entry. Families see **Score 4.5/5 (90%)** on the outline and entry only when every question has points. Until then a submitted entry shows a submitted check, not the score |
| **Teacher grade** | Quiz details lists submissions that need grading, that are autograded and not yet verified, and that a teacher has graded. **Grade next** opens one submission. Points are prefilled from the autograde when there is one. The teacher can type a different amount, including a fraction, up to the points possible. **Save and next** stores that as the teacher’s grade and opens the next waiting submission. The autograded points stay on the answer so a later grade is an override, not a new attempt |
| **Copy** | Course-from-course copies the quiz, questions, choices, keys, and matching prompts, options, and keys. It does not copy entries |
| **Not this slice** | A max-attempt count, Activity, a gradebook, quizzes on course templates, and changes to page quiz blocks |

---

## P2 — Later (long term)

| Feature | Description | Status | Notes |
|---------|-------------|--------|-------|
| **Parent family management (cross-org)** | Parents manage household **across organizations** | planned | Extends P0 **org-scoped** Family / parent directory |
| **Student accounts** | Students log in to view assigned work | shipped | Distinct `admin_invites.role = student`. Claim sets `student_profiles.user_id` and membership `role = student`. Same published-course gates and chrome as parents, for that one profile |
| **Student materials view** | Students access shared lesson materials | shipped | Same published enrollment gate as parents, via `user_id` |
| **Quizzes** | Students take quizzes in-app | deferred | Take-in-app shipped as the P1 course quiz |
| **Orgs collecting payment from parents** | Tuition / class fees through Course Wright | planned | **Future** — not P0/P1 |
| **Integrations** | <!-- TBD --> | planned | |
| **Transcripts / records** | <!-- TBD --> | planned | |

---

## Explicitly out of scope (for now)

- **Native mobile apps** (iOS / Android) — web only
- **Full parent family management across orgs** — deferred to P2 (org-scoped Family / parent directory is **P0**)
- **Orgs collecting tuition from parents** — future; Course Wright bills orgs first
- **Print whole course** — initial release is material / unit / this week only
- <!-- TBD -->

---

## Dependencies & decisions

| Decision | Status | Blocks |
|----------|--------|--------|
| Target org types: **Other** (generic organization), co-ops, schools (`micro_school`), and family (home materials) | **Decided** | New orgs default to **Other**; in-app copy uses organization / co-op / school / family from org type; UI label for `micro_school` is **School**; family = parents making materials at home |
| P0 = course builder (**courses only**) + org management + roster management + RBAC + file sharing + extreme shareability (print + links) | **Decided** | All P0 features; **templates are P1** |
| Roster management in P0 | **Decided** | StudentProfile, Enrollment, ParentInvite |
| Student accounts link `student_profiles.user_id` on a student invite claim | **Decided** | Membership role `student`; not `parent_student_links` |
| P0 roles: owner, admin, instructor, parent, student | **Decided** | RBAC, Membership. Owner vs admin = billing (P1). |
| First course enrollment creates student_profile in org | **Decided** | Enrollment workflow |
| Instructors add students to org via course enrollment | **Decided** | RBAC, roster UX |
| Student profile fields: name (required), parent email (optional), grade level (optional) | **Decided** | StudentProfile |
| Org chooses grade scheme (exact grade, range, or custom) | **Decided** | Org settings, StudentProfile.grade_level |
| Org school days (default Mon–Fri; owners/admins configure) | **Decided** | Org settings circle toggles. Lesson-plan compose defaults to those days; calendar / This week stay Sunday–Saturday |
| Org profile (about, address, website, contact email, phone) | **Decided** | Optional; org settings. Shown on org home when set. Not a public about page |
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
| Parent ↔ staff role change (no re-invite) | **Decided** | One membership row per user/org. Promoting a parent adds an exclusive role and keeps `is_parent`. Removing the exclusive role leaves parent when they are linked to a student, otherwise student when `is_student`, otherwise the membership ends. Students are not changed from Collaborators. |
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
| Material submissions | **Decided** | Toggle on a course material. One slot per enrolled student. Teacher sets file groups and how many submissions (1–10, default 2). Each submission is one or more files with one timestamp. The student account or a linked parent turns it in. Due time is an instant (`due_at`, default 11:59 PM in the saver’s timezone); This week still uses calendar `due_date`. Allow past due defaults on |
| Multiple instructors per course | **Decided** | CourseInstructor |
| Class leads (zero or more staff) | **Decided** | Owners/admins assign owner/admin/instructor as `ClassLeader`. Optional. Notified of class discussion posts. |
| In-app Activity notifications | **Decided** | Stored per user. Discussion posts → instructors, class leads, thread starter, and people who posted (one row per discussion). Staff **Notify everyone** on discussion create. Announcement **Send notification** → claimed families (one row per announcement). Click acks. Installed PWA can also send a device notification for each unread Activity row. |
| Calendar week = Sunday–Saturday | **Decided** | Parent This week and Calendar. Assigned = outline; due = filled. Print is the full dated week **plus each student’s published lesson plans first** |
| Parent must have an account to view (P0) | **Decided** | Invite → signup/login; magic links later |
| Parent profile stays active if enrollment ends (P0) | **Decided** | Defer visibility rules |
| File types/sizes generous | **Decided** | Keep open |
| Grade scheme presets: K–12 and Custom | **Decided** | Org onboarding |
| P1 grading scales org-configurable | **Decided** | Shipped as org grading (`none` / letter / pass/fail), separate from age-level grade scheme |
| Success metric: MAUs | **Decided** | Vision |
| Tagline: Plan wright. Share wright. Course Wright. / Courses, done wright. | **Decided** | BRANDING.md |
| Anyone can create an org; creator is first owner | **Decided** | Org creation. Owners and admins manage org settings; only owners manage billing. |
| Multiple admins via email invite (claimable) | **Decided** | AdminInvite |
| Auth: email + Google | **Decided** | Supabase Auth + Google Cloud OAuth — STACK.md |
| P0 homework = dated materials in a unit | **Decided** | Parent "this week"; assignments next |
| P0 lesson plan = weekly course plan with publish controls | **Decided** | One per course per Sunday–Saturday week; week note + per-day notes/materials; compose defaults to org school days with an add-day modal; link materials via outline multi-select with search; unpublished until published; replaces bulletins; not email; not an assignment object |
| P0 announcement = one-way notice to one or more courses, classes, or students (same kind) | **Decided** | Optional start/end for homepage visibility; unread until opened; no reply thread (**P1 Discussions**); not a lesson plan; optional **Send notification** emails and writes Activity |
| P1 discussion = two-way thread for one course or one class | **Decided (in design)** | Families create for a course their child is enrolled in or a class their child is in; everyone on the thread can post; flat timeline + **Quote** in message body; plain composer + **T** → Lexical; author or staff marks answered; attachments = file / material / URL; Realtime while the SPA is open; not email; not an announcement; ad-hoc student-group audience later |
| Course calendar color | **Decided** | `courses.color_key` from a small muted palette; auto-assigned on create; staff can change in course settings; legend filters the calendar |
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
| Roster = page noun; Enroll/Unenroll = course verbs | **Superseded** | Org people chrome is **Students** (staff/parents) and **Progress** (learners). Course verbs stay Enroll/Unenroll; class/org stay Add/Remove. No top-level Roster or Records |
| Quiz authoring + correct answers + print (blank + answer key) | **Decided** | **P0 page quiz** — Lexical `quiz` node on a lesson page. Not a material kind. Many per page. Whole-page print; parent/student and staff **Student view** = questions only; staff Teacher view = answer key. No roster required |
| Staff parent view (header toggle) | **Decided** | All staff (owner/admin/instructor). Real student home if linked students; otherwise a preview. Hidden for parent-role users. Default Teacher. UI label **Student view**. Student view print omits the page-quiz answer key. Course quizzes follow the parent answer-key rule |
| Quiz online take + autograde | **Decided** | **P1 course quiz** — outline item, not a page block and not `material_submissions`. **Accept entries** toggle; optional start/end (neither = open whenever published). Each question has possible points (default 1, fractions allowed). Multiple choice, number, and matching autograde a first pass the teacher can overwrite. Short answer and long answer wait for the teacher’s points. A long answer has 1–20 blank lines. Share answer key with parents (students never). One attempt unless allowed |
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
