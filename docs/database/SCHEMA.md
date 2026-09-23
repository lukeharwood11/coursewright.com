# Course Wright — Schema (Draft)

> **Status:** Baseline matches `supabase/migrations/` post-squash (`bigserial`/`bigint` app IDs; materials `page`|`link`|`file`; `blocks`; `classes`/`class_members`; `copied_from_course_id`). Product rules stay in this file. **P0** = course builder (**courses only** — Material = page of **blocks**), **classes** (student groups), org management, roster, RBAC, file sharing, parent access, **extreme shareability**. **Course templates** are **P1**.

---

## SQL mapping (P0)

Runtime tables are snake_case of the entities below. Applied by [supabase/migrations/](../../supabase/migrations/). Do not add entities that are not in this document.

| SCHEMA entity | Table | Notes |
|---------------|-------|--------|
| User | `profiles` | PK = `auth.users.id`. Email + Google live in Supabase Auth; `profiles` is the PostgREST-facing row. |
| Organization | `organizations` | |
| OrganizationBranding | `organization_branding` | Owner-only writes. Members read the row. Icon file and path are public via `organization_icons`. |
| Membership | `memberships` | |
| AdminInvite | `admin_invites` | Unified email-claim invite. Role payload: `owner` / `admin` / `instructor` / `parent`. Claimed via emailed `/invite/<token>` (Resend `organization-invite`) or pending-request inbox after login. Copy-link remains. Membership is created on claim. |
| StudentProfile | `student_profiles` | |
| Family | `families` | |
| FamilyMember | `family_members` | |
| ParentInvite | `admin_invites` (`role = parent`) | Same token table as staff. One pending per `(org, email)`; students via `admin_invite_students`. Separate `parent_invites` table retired. |
| AdminInviteStudents | `admin_invite_students` | Students attached to a parent AdminInvite. Claim links all of them. |
| ParentStudentLink | `parent_student_links` | |
| Enrollment | `enrollments` | |
| Course | `courses` | P0 |
| Class | `classes` | **P0** — group of students; **not** a course |
| ClassMember | `class_members` | **P0** — student_profile ↔ class |
| ClassLeader | `class_leaders` | **P0** — staff assigned as a lead for a class |
| CourseTemplate | `course_templates` | **P1** product — table exists |
| TemplateAccess | `template_access` | **P1** product — table exists |
| CourseInstructor | `course_instructors` | |
| Unit | `units` | |
| Material | `materials` | page · link · file; `unit_id` nullable (top-level) |
| Block | `blocks` | Ordered content on a page material (`rich_text` · `video`; quiz lives as a Lexical node in rich-text `body.lexical`) |
| MaterialVersion | `material_versions` | |
| MaterialSubmission | `material_submissions` | One slot per student per material. Not a quiz Submission |
| MaterialSubmissionVersion | `material_submission_versions` | One turn-in (one or more files, one timestamp) |
| MaterialSubmissionFile | `material_submission_files` | Immutable file in a turn-in |
| File | `files` | |
| FileVersion | `file_versions` | |
| ShareLink | `share_links` | |
| ImportantNow | `important_now` | |
| LessonPlan | `lesson_plans` | Weekly course plan; published / unpublished |
| LessonPlanDay | `lesson_plan_days` | Optional note for one day in that week |
| LessonPlanDayMaterial | `lesson_plan_day_materials` | Materials listed under a day |
| Event | `events` | One course, several classes, or the whole organization. Required location |
| EventBlock | `event_blocks` | Lexical write-up on an event (`rich_text` · `video`). Not a course material |
| EventMaterial | `event_materials` | Existing course materials linked from an event |
| Announcement | `announcements` | One-way notice to one or more courses, classes, or students (same kind) |
| AnnouncementRead | `announcement_reads` | Per-user read receipt (clears the notification icon) |
| Discussion | `discussions` | **P1** — two-way thread for one course or one class |
| DiscussionMessage | `discussion_messages` | **P1** — flat post; body plain or Lexical (+ optional quote in body) |
| DiscussionMessageAttachment | `discussion_message_attachments` | **P1** — file / material / url on a message |
| DiscussionRead | `discussion_reads` | **P1** — per-user last read (unread badge) |
| Notification | `notifications` | **P1** — per-user Activity item; ack via `read_at` |
| PushSubscription | `push_subscriptions` | **P1** — Web Push endpoint for an installed app |
| Feedback | `feedback` | Signed-in product notes; identity copied from the session |
| OrgResourceFolder | `org_resource_folders` | **P1a** — nested org folders; ACL presets + inherit |
| OrgResourceItem | `org_resource_items` | **P1a** — document · link · file; not a course material |
| OrgResourceBlock | `org_resource_blocks` | **P1a** — Lexical body on document items |
| OrgResourceGrant | `org_resource_grants` | **P1a** — extra read/write for a person on a folder or item |
| WeeklyContent | *(not a table)* | Derived from material/unit dates + published lesson plans (Sunday–Saturday). |
| Page / Block / Quiz / Form | `blocks` (quiz is a Lexical node on a page) | Material **kind** page\|link\|file; blocks on pages only; **no** quiz table |

**Locked conventions:**

| Convention | Rule |
|------------|------|
| **App PKs** | Prefer **`bigserial`** / **`bigint` identity** for auto-incrementing primary keys (`id`) |
| **App FKs** | `bigint` referencing those PKs |
| **Auth-linked** | `profiles.id` (and FKs to `auth.users` / `profiles`) stay **`uuid`** — Supabase Auth owns those |
| **Timestamps** | `timestamptz` |
| **Strings** | `text` |
| **Enums** | `text` + check constraints |
| **Audit** | `created_at` / `updated_at` on app rows |
| **Content deletes** | `deleted_at` (no authenticated hard-delete) |

**Note:** Field tables below use **`bigint`** for app entity PKs/FKs. Only auth-linked columns (`profiles.id` and FKs to `User` / `auth.users`) stay **`uuid`**. Runtime migrations match this baseline.

---

## Phase overview

| Phase | Entities in focus |
|-------|-------------------|
| **P0** | Organization, User, Membership, **AdminInvite**, **AdminInviteStudents**, **StudentProfile**, **Class**, **ClassMember**, **ClassLeader**, **Family**, **FamilyMember**, Enrollment, ParentInvite, ParentStudentLink, CourseInstructor, Course, **Unit**, **Material** (page), **Block**, **MaterialVersion**, File, **FileVersion**, ShareLink, ImportantNow, **LessonPlan**, **LessonPlanDay**, **LessonPlanDayMaterial**, **Announcement**, **AnnouncementRead**, **search indexes / facets**. (**Create course from course** copies units/materials/blocks — Function candidate.) |
| **P1** | **CourseTemplate**, **TemplateAccess**, template↔course sync/promote/deprecate, CourseSummary, Grade, InstructorNote, ChecklistItem, **OrgSubscription** (Course Wright bills orgs), **Discussion**, **DiscussionMessage**, **DiscussionMessageAttachment**, **DiscussionRead**, **Notification**, **PushSubscription**, **Feedback**, **OrgResourceFolder**, **OrgResourceItem**, **OrgResourceBlock**, **OrgResourceGrant**, **MaterialSubmission**, **MaterialSubmissionVersion**, **MaterialSubmissionFile** |
| **P2** | Cross-org Family management, StudentProfile.user_id, Quiz online, Submission, **ParentPayments** (orgs collect from parents) |

---

## P0 access model

### Roles (Membership.role)

| Role | P0 |
|------|-----|
| `owner` | Yes — create org (first owner), everything an admin can do, plus **billing** (P1) |
| `admin` | Yes — invite more admins, **change admin ↔ instructor**, **remove** admins/instructors (not last owner/admin), manage org + permalink slug. **Cannot** manage billing |
| `instructor` | Yes — course builder, enroll student profiles, invite parents, add students via course |
| `parent` | Yes — view **and print** shared content for linked enrolled student profile(s) |

**Note:** Students do **not** have user accounts in P0/P1. They exist as `student_profile` records only.

### Parent access gate

**Membership** (parent role) is created when the invited email **claims** a parent invite — same token path as staff. Claiming also writes `parent_student_links`.

**Course access** still keys off enrollment, not the invite:

1. Active **parent** membership in the organization.
2. A `parent_student_links` row for that user.
3. That student profile has an **enrollment** in a course with **`status = active`** and **`visibility = published`**.

A claimed parent with no enrollment can open the org (empty “this week”) but cannot SELECT courses.

**Active course** = `Course.status = active`. Optional `start_date` / `end_date` are informational, not access gates.

**Published course** = `Course.visibility = published`. Parents SELECT a course (and its content via `parent_can_view_course`) only when the course is **active and published**. Unpublished courses are instructors/admins only. New courses default unpublished; existing rows stayed published when the column was added.

**P0:** Invite email → parent **must sign up or log in** with that email before viewing. Magic links (no account) are later. **v0 does not send email** — staff copy `/invite/<token>`. **Print** is available on any material/unit/week they can view.

**P0 if enrollments end:** parent User / Membership stays **active**. Visibility rules deferred.

---

## Course model (P0) & templates (P1)

| | **Course (P0)** | **CourseTemplate (P1)** |
|---|-----------------|-------------------------|
| Reusable blueprint | No — a specific offering (may be **copied from** another course) | Yes |
| `template_id` | Nullable FK — used when templates ship (**P1**); unused in P0 product flows | N/A |
| `copied_from_course_id` | Optional origin when created from another course (**P0**) — informational only, **no live sync** | N/A |
| Start / end dates | Optional `start_date`, `end_date` (informational) | No |
| Catalog | Optional `description`, `location`, `subject` | `description` exists; location/subject not on templates |
| Visibility | `published` / `unpublished` — parents need **active + published** | N/A |
| Roster | Yes — `Enrollment` per course | No |
| Materials | Course units/materials | Template materials; linked copies + promote/sync (**P1**) |
| Access control | Course instructors (many) + org RBAC | **view / edit / owner** — creator is owner; org admins see all; instructor + view ⇒ can create a course (**P1**) |
| Active state | `status = active` means the offering is running | N/A |

---

## Creating a course from another course (P0)

1. Copies **units and materials** (and file **references** — same `file_id`, no blob clone) into a **new course**.
2. Does **not** copy roster, enrollments, important-now, share links, **lesson plans**, **announcements**, or **discussions**.
3. New course is **independent** — edits do not sync back to the source (template-style sync is **P1**).
4. Grade metadata **may** copy and remain editable on the new course.
5. Description, location, and subject **may** copy from the create form (prefilled from the source). The copy starts **unpublished**.

---

## Template ↔ course behavior (P1)

Tables and lineage columns may already exist; **product UI and Functions are P1**.

1. Creating a course **from a template** copies all materials and lesson plans. The course **remains linked** via `template_id`.
2. Creating a course **without a template** starts blank (or via P0 course-from-course). That course can later be **promoted to a template** (**P1**).
3. Content added on a linked course does **not** automatically update the template. The instructor can **opt in** to **promote** it (resource or whole course → template).
4. **Template → course sync:** an edit to a template resource updates the matching course copy **only if** that copy still exists and is **not overridden**. Overridden copies are never overwritten.
5. Template and instance materials are separate records (`copied_from_id` for lineage).

### Override rule (P1)

| Course copy state | Template edit |
|-------------------|---------------|
| Unmodified (still in sync) | Receives the update |
| Overridden (edited on this course) | Left alone |
| Copy removed / never existed | No update |

Editing a course copy of a template resource **marks it overridden** and stops further sync for that resource.

### Removing a template resource (P1)

Configurable — the actor chooses:

| Action | Template | Active courses |
|--------|----------|----------------|
| **Deprecate** | Marked deprecated; not used for new courses / new copies | **Unaffected** |
| **Delete** | Soft-deleted | Unmodified synced copies **soft-deleted** too; overridden copies **left alone** |

Deprecate is the safe default when content should retire without disrupting live offerings. Delete cascades soft-delete only to copies still in sync (not overridden). Both are reversible via versions / restore.

---

## Versioning, audit, and soft deletes

**Decided for content (materials, files, lesson plans):**

- **Soft delete** — `deleted_at` / `deleted_by`; never hard-delete user content.
- **Versions** — each change stores prior state, actor, and timestamp.
- **Revert** — restore a previous version (including undelete).
- **File blobs are versioned** — replacing a file uploads a **new** Storage object; prior blobs are retained so revert can restore them. Metadata-only history is **not** enough.

### MaterialVersion

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| material_id | bigint | FK → Material |
| version | int | monotonic per material, starting at 1 |
| snapshot | jsonb | material columns + ordered blocks (for pages) at this version |
| changed_by | uuid | FK → User (`profiles`), nullable |
| changed_at | timestamptz | |
| change_type | text | create · update · delete · restore · sync · promote · deprecate |

### FileVersion

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| file_id | bigint | FK → File |
| version | int | monotonic per file, starting at 1 |
| storage_ref | text | **this version’s** Storage object (blob retained after replace) |
| filename | text | |
| mime_type | text | |
| size_bytes | bigint | |
| changed_by | uuid | FK → User (`profiles`), nullable |
| changed_at | timestamptz | |
| change_type | text | create · replace · restore · delete |

`File.storage_ref` / current metadata always point at the **current** version; history lives in `FileVersion`.

---

## Roster management (P0)

| Entity | Roster role |
|--------|-------------|
| `StudentProfile` | Org-level student record — **no user account** |
| `Family` | Org-scoped household — parent directory |
| `FamilyMember` | Parent user and/or student profile ↔ Family |
| `Enrollment` | **Course roster** — student profile ↔ course instance |
| `ParentInvite` / `ParentStudentLink` | Parent user ↔ student profile linkage |
| `Membership` | Staff (admin, instructor) in org |
| `CourseInstructor` | Instructor ↔ course instance assignment |
| `ClassLeader` | Staff (owner / admin / instructor) ↔ class — optional; zero or more |

### Student profile creation flow

**Decided:**

1. Instructors (and admins) can add students when managing a course roster.
2. If the student does not yet exist in the org, enrolling them in a course **creates a `student_profile`** under the organization.
3. No `User` account is created for the student in P0/P1.
4. A student `User` account is **linked** to an existing `student_profile` via `user_id` when a student invite is claimed.

### CourseInstructor

Multiple instructors per course (co-teaching). **P0.**

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| course_id | bigint | FK → Course |
| user_id | uuid | FK → User (`profiles`) — instructor |
| unique | (course_id, user_id) | Co-teaching; no extra course-role in P0 |

**On create:** membership role `instructor` is auto-inserted as a teacher for the new course (so they can see and manage it). Org **owner / admin** creators are **not** auto-added — they assign teachers (including themselves) from course settings / roster. Owners/admins already SELECT every course via org admin RLS.

---

## File sharing (P0 minimum)

**`File` is org-scoped and referenced** from materials / page blocks — not owned by a single material row. Template → course copies the **`file_id`**, not the Storage blob. P0 UI still attaches files in the course builder (not a standalone drive). See [FILE_STORAGE.md](../FILE_STORAGE.md).

### File

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK — org-scoped entity |
| filename | text | current version |
| storage_ref | text | current version’s Storage object path |
| mime_type | text | current |
| size_bytes | bigint | current |
| current_version | int | matches `FileVersion.version` |
| uploaded_by | uuid | FK → User (`profiles`) |
| uploaded_at | timestamptz | |
| deleted_at | timestamptz | soft delete — warn/block if still referenced (TBD) |

**References:** `Material.file_id` and/or page blocks hold `file_id` → `File`. **P1 discussions** also reference `File` from `DiscussionMessageAttachment`. **P1a Resources** reference `File` from `OrgResourceItem` (`type = file`) and `OrgResourceBlock`. Parents may SELECT a file when they can view a resource that references it (`parent_can_view_file`). No `File.material_id` owner FK. No `copied_from_id` on File for template copy — copy shares the same id.

Generous types/sizes — keep open. **Audio and video MIME types are first-class** (in-app players in the product). Replacing a file creates a new `FileVersion` + new Storage blob; prior blobs stay for revert. **Replace updates all referrers** unless a fork creates a new `File` (open — FILE_STORAGE).

**Playback:** UI uses `mime_type` (and optionally duration / poster — TBD) to choose audio vs video player. YouTube embeds are not `File` rows — they live in Page blocks.

---

## Search (P0)

Search is a product requirement — schema must support **text + facets**, not only UI filtering of loaded lists.

| Concern | Notes |
|---------|-------|
| **Searchable surfaces** | Material title/body (as indexed), File filename, Course title + description + subject + location, Template title + description, Unit title, StudentProfile name, Family names, instructor names. Org resource title/description has a `search_vector` for later facet work |
| **Facets (examples)** | course_id, unit_id, material kind, mime_type / media kind, grade levels, important now, date ranges, role-visible org scope |
| **Access** | Results filtered by same RLS as underlying rows |
| **Implementation (hypothesis)** | Postgres `tsvector` / GIN indexes + structured `WHERE` facets via PostgREST; escalate later if needed |

Exact index DDL deferred to migrations; do not ship P0 without a plan for these indexes.

---

## Print (P0)

Print is **not a stored entity**. It is a print-friendly view of content the actor can already access.

| Grain | Source | Route |
|-------|--------|-------|
| Material | One `Material` (+ attached `File`s) | `…/materials/<id>/print` |
| Unit | All materials in a `Unit`, in `position` order | `…/units/<id>/print` |
| This week | Dated materials (and Important now) whose dates fall in the current Sunday–Saturday week | `/my/<org-slug>/print-this-week` |
| Resource (**P1a**) | One `OrgResourceItem` (document or file) | `…/resources/items/<id>/print` |

**Not P0:** print whole course.

**P0 output:** client-generated **PDF** shown in an in-app viewer on the print route → **Download** (`.pdf`) and **Print**. No `PrintJob` / persisted-PDF table in P0 — generate on the fly. Do not name routes or primary entry UI **Export**.

Access: same as viewing that material / unit / dashboard. Create → print does **not** require Enrollment.

UI map: [URLS.md](../URLS.md), [PRINT](../pages/PRINT.md).

---

## Core entities — P0

### Organization

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| name | text | |
| slug | text | **Unique permalink** — generated on create; changeable with UX warning that links will break |
| org_type | text | `other` (default for new orgs) · `coop` · `micro_school` · `family` |
| grade_scheme | text | `k12` · `custom` |
| grade_labels | text[] | Allowed labels for student `grade_level` and course/template `grade_levels`. K–12 preset includes K, 1–12, and common bands (K-2, 3-5, 6-8, 9-12). Custom is org-defined. |
| school_days | smallint[] | Weekdays the org operates. Values match JS `Date.getDay()` (`0` Sunday … `6` Saturday). Default `{1,2,3,4,5}` (Mon–Fri). At least one unique value in `0..6`. Lesson-plan compose defaults to these days; the Sunday–Saturday week model is unchanged. |
| about | text | Optional in-app about blurb (max 4000). Shown on org home when set. Not a public marketing page. |
| address | text | Optional free-text location / mailing address (max 500). |
| website | text | Optional external URL (max 200). |
| contact_email | text | Optional org-facing inbox (max 200) — not a login email. |
| phone | text | Optional org phone, free text (max 200). |

**Permalink:** created with the org (derived from name, uniquified). Owners and admins may edit `slug`; the product **warns** that existing org URLs will break. P0 does **not** require keeping old slugs as redirects.

**Grade scheme:** the org decides how student **and course** grade levels work. Course Wright provides options (exact grade, range, custom). Student `grade_level` and course/template grade metadata must match the scheme when set.

**School days:** owners and admins set which weekdays school operates. Instructors see the setting read-only. Calendar week view and parent This week stay Sunday–Saturday; empty days still omit on This week.

**Profile:** optional about / address / website / contact email / phone. Owners and admins edit in org settings. When any field is set, org home (staff and parent) shows a compact About this organization card.

### OrganizationBranding

One optional row per organization. **Owners** set it. Admins, instructors, and parents can read the row and see it in chrome; they cannot write it. Separate from `organizations` because org updates are allowed for any admin.

**The icon is public.** Storage bucket `org-brand` allows `select` for `public`, so anyone with the URL can load the picture — including someone who is not a member (a future invite page). View `organization_icons` exposes only `organization_id`, `icon_path`, and `updated_at` to `anon` and `authenticated`. `accent_color` stays on this table and is not on that view.

| Field | Type | Notes |
|-------|------|-------|
| organization_id | bigint | PK, FK → Organization, cascade delete |
| accent_color | text | Optional `#rrggbb`. Empty means Wright Green. Inside the org this replaces the primary color. The app rejects colors that fail WCAG AA (4.5:1) for white text on the color and for the color as text on paper, and derives a darker hover and a light tint. |
| icon_path | text | Optional Storage path `{organization_id}/icon.{png\|jpg\|webp}` in the public `org-brand` bucket (256 KB). Empty means the CW mark. The object and this path (via `organization_icons`) are readable without a membership. |
| updated_at | timestamptz | Cache-busts the public icon URL |

**Chrome only.** The accent restyles the org sidebar and header controls. It does not recolor page content, emails, or print. The icon also appears beside the org name on the account org list.

### User

Authenticated users only: admins, instructors, parents. **Not students** (P0/P1). Table: `profiles`; PK is `auth.users.id`. Org members may view another member’s **directory profile** (name, role, courses they teach/lead/are on) via `get_org_person_profile`. Email is not part of that directory. People still edit their own name on account settings.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK = `auth.users.id` |
| email | text | Unique, lowercased; synced from Auth |
| name | text | Display name |
| google_id | text | nullable, unique — Google subject when signed in with Google |

### Membership

Org staff and parent or student memberships. One active membership per user per org (single `role`). Owners and admins may **change** roles among `admin` ↔ `instructor` ↔ `parent` ↔ `student` (and owners may assign `owner`) and **remove** admin/instructor memberships that have no linked student and no student account. Setting `role = parent` requires an existing `ParentStudentLink` to a `StudentProfile` in that org. Setting `role = student` requires `StudentProfile.user_id` for that user in the org. **Cannot** remove or demote the last remaining `owner` or `admin`. These writes touch **`memberships` only**. Course materials and roster stay **enrollment-gated** (and `ParentStudentLink` or `StudentProfile.user_id` where applicable) — do **not** add a second staff-role gate on content RLS.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| user_id | uuid | FK → User, **nullable** until invite is claimed |
| role | text | owner · admin · instructor · parent · student |
| status | text | active · invited · suspended |

### AdminInvite

Unified email-claim invite. **Role is payload:** `owner` / `admin` / `instructor` (staff), `parent`, or `student`. Claimed by opening `/invite/<token>` or by signing in with that email and accepting a pending request. **Anyone with the token can preview** org name, role, and invited email via `get_invite` (unsigned `email_matches` is false). **Claim still requires** a signed-in account on that email. **Membership is created on claim.** Family course access still requires enrollment (see Parent access gate). Student claim also sets `StudentProfile.user_id`.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| email | text | Lowercased — must match the account that claims |
| role | text | `owner` · `admin` · `instructor` · `parent` · `student` |
| student_profile_id | bigint | FK → StudentProfile, **required when `role` is `parent` or `student`** (anchor student), else null |
| invited_by | uuid | FK → User |
| token | text | Unique invite token (returned on insert; used in `/invite/<token>`) |
| accepted_at | timestamptz | nullable |
| membership_id | bigint | FK → Membership, nullable |

**Pending uniqueness:** one pending staff invite per `(organization_id, email)`; one pending parent invite per `(organization_id, email)`; one pending student invite per `(organization_id, email)`. Additional students for a parent invite attach via `admin_invite_students`. Student invites do not attach extra students.

**Who can invite staff:** owners and admins. Admins may invite `admin` or `instructor`. Only owners may invite another `owner`. Instructors cannot invite org staff.

**Who can invite parents:** owners, admins, and instructors. Parent invites are created from roster / student profile (copy `/invite/<token>`). Same email for another student attaches to the existing pending invite (no second email). The Families directory, when routed, attaches chosen students to one pending invite when linking an email with no account.

**Who can invite students:** owners, admins, and instructors. One profile per invite. Claim sets `student_profiles.user_id` and creates membership `role = student` unless the person is already staff (staff role is kept; `user_id` is still set).

---

### StudentProfile

Org-level student record. Optional **student account**: `user_id` is set when a `role = student` invite is claimed.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| name | text | **Required** — only required field |
| parent_email | text | **Optional** — first parent email for create/search; more parents via invites + `ParentStudentLink` |
| student_email | text | **Optional** — student contact email; invite uses `admin_invites.role = student` |
| grade_level | text | **Optional** — must be in org `grade_labels` when set |
| user_id | uuid | FK → User, **nullable** — set on student-invite claim. Unique per org when set |
| created_at | timestamptz | |
| created_via_course_id | bigint | FK → Course, nullable — course that triggered first enrollment |

No other student-profile fields in P0 besides optional parent/student emails and grade.

Staff may **delete** a profile. Class membership, enrollments, parent links, and invites cascade. If `user_id` has a `role = student` membership in the org, that membership ends. A staff role on the same account is kept.

### Family

Org-scoped **named group of student profiles** for the parent directory (Class-mirror). Empty family is OK. **Not an access gate** — materials, this-week, and print stay enrollment + `ParentStudentLink`.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| display_name | text | **required in P0 directory UI** (column remains nullable in SQL) |
| created_at | timestamptz | |
| deleted_at | timestamptz | soft delete |

### FamilyMember

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| family_id | bigint | FK → Family |
| student_profile_id | bigint | FK, nullable — student in household |
| parent_user_id | uuid | FK → User, nullable — **unused for P0 app writes**; parents are derived from `ParentStudentLink`. Not an access gate |
| display_name | text | **names** on the family profile (may mirror linked profile/user) |

**Uniqueness (locked):** at least one of `student_profile_id` / `parent_user_id`; a student profile belongs to at most one family; unique `(family_id, parent_user_id)` when parent is set.

**P0 app rule:** `family_members` rows are **students** (Class-mirror). Parents appear on a family only via `ParentStudentLink` to those students — a parent may appear on two families that way. Linking a parent creates or reuses those links (or a pending `ParentInvite` if they have no account). Never write enrollments from the directory. Merge/split UX TBD.

### ParentInvite

Stored on `admin_invites` with `role = parent` (same token / claim RPCs as staff). The separate `parent_invites` table is retired.

**One pending invite per `(organization_id, email)`.** `student_profile_id` on the invite is the **anchor** (first student). Additional students attach via `admin_invite_students` — inviting the same email again for another student attaches without a new token or email.

Emails Resend `organization-invite` and keeps copy `/invite/<token>`. On claim: create parent membership (if needed) and `parent_student_links` for **every** attached student. Do **not** grant course access from the invite alone. Unrouted Families directory attaches chosen students to one pending parent invite (one email).

### AdminInviteStudents

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| invite_id | bigint | FK → AdminInvite (cascade) |
| student_profile_id | bigint | FK → StudentProfile (cascade) |
| unique | (invite_id, student_profile_id) | |

### ParentStudentLink

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| parent_user_id | uuid | FK → User |
| student_profile_id | bigint | FK → StudentProfile |
| unique | (parent_user_id, student_profile_id) | Verified via invite or email match (enforced in claim Function) |

### Enrollment

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| student_profile_id | bigint | FK → StudentProfile |
| course_id | bigint | FK → Course |
| status | text | active · completed · withdrawn |
| enrolled_at | timestamptz | |

**Decided:** Enrollment is always per student (`student_profile` ↔ course). A Class may be used as a **batch preset** when enrolling (one-shot copy of members into enrollments — not a live link). See FEATURES Classes.

### Class

Org-scoped **group of students**. Not a Course — no units/materials.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| title | text | |
| description | text | nullable — TBD if needed |
| deleted_at | timestamptz | soft delete |
| created_at / updated_at | timestamptz | |

### ClassMember

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| class_id | bigint | FK → Class |
| student_profile_id | bigint | FK → StudentProfile |
| unique | (class_id, student_profile_id) | |

**Open:** Can a student belong to multiple classes? Default assumption **yes** until decided otherwise.

### ClassLeader

Zero or more **leads** for a class. **P0.** Owners and admins assign; instructors may read the list. A class may have no leads.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| class_id | bigint | FK → Class |
| user_id | uuid | FK → User (`profiles`) — must be an active owner, admin, or instructor in the class’s org |
| unique | (class_id, user_id) | |

Leads are notified in **Activity** when someone posts in a discussion for that class. Demoting or removing staff membership drops their lead rows for classes in that org.

### Course

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| title | text | |
| description | text | optional short blurb — not the P1 **Summary** |
| location | text | optional where the offering meets (free text) |
| subject | text | optional subject / area (free text, not a taxonomy) |
| icon_key | text | **optional** — Heroicons outline key for course catalog cards; null = none |
| color_key | text | Calendar / legend color from a small palette (`moss` · `slate` · `clay` · `plum` · `sea` · `wine` · `sand` · `pine`). Auto-assigned on create; staff can change in course settings |
| template_id | bigint | FK → CourseTemplate, **nullable** — **P1** live link when created from a template; unused in P0 product flows |
| copied_from_course_id | bigint | FK → Course, **nullable** — P0 origin when created from another course (informational, no sync) |
| start_date | date | nullable — informational |
| end_date | date | nullable — informational |
| grade_levels | text[] | **optional** — one or more labels from org `grade_labels` |
| status | text | **active** · archived — offering is running vs archived |
| visibility | text | **unpublished** (owners/admins, and instructors who teach the course) · **published** (those staff, plus enrolled parents; students when that role exists). New courses default unpublished |

**Who can SELECT:** org owner/admin (`is_org_admin` on `organization_id`), or `course_instructors` for this course, or `parent_can_view_course` (linked student enrolled in an **active + published** course), or org staff when the course has no other instructors (covers create `INSERT … RETURNING` / orphans). Same intent as `can_view_course`, but the `courses` SELECT policy must not re-read `courses` by id. Membership **role need not be `parent`** — an instructor who parents a student still sees that published course, read-only in the app. Instructors do **not** see other instructors’ courses they neither teach nor parent in.

**Grade levels:** `text[]` of scheme values (exact grades and/or range labels). Same model on `CourseTemplate`.

### CourseTemplate

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| title | text | |
| description | text | |
| grade_levels | text[] | **optional** — same shape as Course.grade_levels |
| created_by | uuid | FK → User — default owner |
| deleted_at | timestamptz | soft delete (archived templates) |

### TemplateAccess

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| template_id | bigint | FK → CourseTemplate |
| user_id | uuid | FK → User |
| permission | text | owner · edit · view — creator defaults to owner |

### Unit

Optional content grouping on a **course** (P0) or a **template** (P1). Materials may belong to a unit **or** be course top-level (`unit_id` null). Exactly one of `course_id` or `template_id` on the unit.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| course_id | bigint | FK → Course, nullable |
| template_id | bigint | FK → CourseTemplate, nullable |
| title | text | |
| start_date | date | **optional** — unit date range |
| end_date | date | **optional** — unit date range |
| position | int | order |
| copied_from_id | bigint | FK → Unit, nullable — lineage for sync |
| is_overridden | boolean | same override rules as Material |
| deleted_at | timestamptz | soft delete |
| deprecated_at | timestamptz | nullable |

**Dating:** unit dates, per-material `scheduled_date` (assignment), and per-material `due_date` are **all optional**. For parent "this week": material appears when **assignment** falls in the week (`scheduled_date` when set; otherwise the unit range if the material has a unit) **and/or** when `due_date` falls in the week. Top-level materials need `scheduled_date` to count as assigned for the week. UI always labels **Assigned** vs **Due**.

### Material

Placement in a unit (course **P0** or template **P1**). **kind** chooses the shape. Exactly one of `course_id` or `template_id`.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| course_id | bigint | FK → Course, nullable |
| template_id | bigint | FK → CourseTemplate, nullable |
| unit_id | bigint | FK → Unit, **nullable** — null = **course top-level** material (shown above units) |
| title | text | **required** — all kinds |
| description | text | **optional** — all kinds (page · link · file); short blurb for lists / parents |
| kind | text | **v1:** `page` · `link` · `file` |
| url | text | nullable — required when `kind = link` |
| file_id | bigint | FK → **File**, nullable — required when `kind = file` |
| scheduled_date | date | **optional** — assignment date; when set, used for calendar-week dashboard (wins over unit dates) |
| due_date | date | **optional** — calendar due day; materials also appear on parent This week when this date falls in the week |
| due_at | timestamptz | **optional** — due instant for submissions. Null until the due date is saved with a time. Default wall time is 11:59 PM |
| due_timezone | text | **optional** — IANA zone captured when the due time is saved. Display the deadline in this zone |
| accept_submissions | boolean | default false. The student account or a linked parent may turn in files for an enrolled student |
| allow_submissions_past_due | boolean | default true. When false, turn-in stops after `due_at` |
| submission_limit | int | 1–10, default 2. How many times one student may turn work in |
| submission_file_types | text[] | `pdf` · `image` · `document` · `audio` · `video`. At least one when accept submissions is on |
| visibility | text | **`unpublished`** (instructors/admins) · **`published`** (enrolled parents; students when that role exists). New materials default unpublished |
| position | int | order within the unit, or among top-level materials when `unit_id` is null |
| copied_from_id | bigint | FK → Material, nullable — source Material when copied (course-from-course **P0**, or template→course **P1**) |
| is_overridden | boolean | true once this course copy is edited independently — **stops template sync** (**P1**) |
| status | text | active · **deprecated** · (soft-deleted via deleted_at) |
| current_version | int | matches `MaterialVersion.version` |
| deleted_at | timestamptz | soft delete |
| deleted_by | uuid | FK → User, nullable |
| deprecated_at | timestamptz | nullable — deprecate path (**P1**) |
| deprecated_by | uuid | FK → User, nullable |
| promoted_to_id | bigint | FK → Material, nullable — **P1** promote |

| kind | Content |
|------|---------|
| `page` | Ordered **Block** rows (no material-level body blob); plus title + description |
| `link` | `url` (+ title + description) |
| `file` | `file_id` → org File (+ title + description) |

**Deprecated / migrate away:** opaque whole-page `body` jsonb; old kind values (`document`, `quiz`, …) — replace with v1 kinds + blocks for pages.

### Material submission

A student (or a linked parent on their behalf) turns work in on a **course** material with `accept_submissions`. Not a quiz Submission (that stays **P2**: `Course ──< Quiz ──< Submission`). Not a separate assignment object.

One `material_submissions` row per student per material (unique while not deleted). The student’s account and any parent linked to that student upload into the same slot.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| course_id | bigint | FK → Course |
| material_id | bigint | FK → Material |
| student_profile_id | bigint | FK → StudentProfile |
| deleted_at | timestamptz | soft delete. The app does not delete turned-in work |

**Version** (`material_submission_versions`): `version` starts at 1. Unique `(submission_id, version)`. `submitted_by` is the parent or student account that turned it in. `submitted_at` is set when every file in the batch has landed. The count of versions cannot pass `submission_limit` (enforced in the RPC). Lowering the limit does not hide versions already stored.

**Files** (`material_submission_files`): one or more per version, each an immutable `files` row. Unique `file_id`. A later submission does not replace an earlier file.

**Who can read:** course managers (`can_manage_course`) see every student. A parent sees a submission only for a student they are linked to, and only while the material is published and they can view the course. A student account sees only their own slot under the same published-course gate. Submission files are **not** readable by every family who can see the material.

**Who can write:** `begin_material_submission` / `finish_material_submission` only. The caller must be the student (`student_profiles.user_id`) or a linked parent, the student enrolled and active, the material published and accepting submissions, every file in an allowed group, and the past-due rule must allow it. Families do not get a general file insert.

An in-progress upload claim (`material_submission_uploads`) holds file ids between begin and finish. It is not a submission. Abandoned claims stay unreferenced.

### Block

Ordered content piece on a **page** material only (`materials.kind = page`).

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| material_id | bigint | FK → Material (`kind = page`) |
| position | int | order within the page |
| kind | text | **P0:** `rich_text` · `video` — **quiz** is a Lexical node inside rich-text `body.lexical` (same page; not a material kind) |
| body | jsonb | Kind-specific payload. Rich text: Lexical editor JSON in `lexical` (legacy `markdown` still accepted). Video: URL |
| file_id | bigint | FK → File, nullable — when block references an uploaded file |
| copied_from_id | bigint | FK → Block, nullable — lineage on course-from-course / template copy |
| deleted_at | timestamptz | soft delete |

**P0 block kinds (pages):**

| kind | Payload (sketch) |
|------|------------------|
| `rich_text` | Lexical editor state (`body.lexical`); **quiz** and in-page **file** nodes live here. Quiz payload: prompt, multiple-choice and/or short-answer, correct answers (print key in P0; autograde in P1). Legacy `body.markdown` still reads |
| `video` | URL embed and/or uploaded `file_id` — **open** which modes |

**Not v1 material kinds:** quiz (it’s a **page block**), audio. External URLs at the unit level use material `kind = link`, not a link block (unless we later add link blocks inside pages — TBD).

### OrgResourceFolder

Nested folder in an organization’s **Resources** library. Independent of courses — no enrollment gate.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| parent_id | bigint | FK → OrgResourceFolder, **nullable** — null = top-level folder |
| name | text | required |
| description | text | optional |
| access_mode | text | `staff` · `parents` · `members` · `restricted` — used when this folder is the ACL source |
| acl_inherit | boolean | default true when nested; **false** at root. When true, walk to parent for ACL |
| sort_order | int | order among siblings |
| archived_at | timestamptz | soft archive; hidden from default browse |
| created_by | uuid | FK → User |

**ACL source:** walk `parent_id` while `acl_inherit` until a folder with `acl_inherit = false` (roots are always false). Effective readers/writers = that folder’s `access_mode` plus `OrgResourceGrant` rows on **that** folder.

**Who can edit:** org staff (owner / admin / instructor), **created_by**, or a **write** grant on the ACL-source folder. Staff may create top-level folders.

**Who can view:** editors; or (non-archived) members allowed by the effective preset / read-or-write grant. Folders are not published — only items are.

### OrgResourceItem

A document, link, or file sitting in a folder (or unfiled at org root). **Not** a `materials` row.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| folder_id | bigint | FK → OrgResourceFolder, **nullable** — null = unfiled at org root |
| type | text | `document` · `link` · `file` |
| title | text | required; file items default from the upload filename and stay editable |
| description | text | optional |
| url | text | required when `type = link` |
| file_id | bigint | FK → File, required when `type = file` |
| visibility | text | `unpublished` (editors only) · `published` (readers per ACL). Default unpublished |
| acl_inherit | boolean | default true → use folder ACL source. False → this row’s `access_mode` + item grants only |
| access_mode | text | same presets as folders; used when `acl_inherit = false` |
| archived_at | timestamptz | soft archive |
| created_by | uuid | FK → User |

Unfiled items that inherit have no folder ACL — only staff (and item-level grants if not inheriting) can see them.

**Who can edit:** org staff, **created_by**, or a **write** grant on the resolved ACL source (item grants when not inheriting; otherwise the folder ACL source).

**Who can view:** editors always (including unpublished). Others only when `visibility = published` **and** the effective preset or a read/write grant allows them. Course enrollment is **not** consulted.

### OrgResourceBlock

Ordered content on a **document** item (`org_resource_items.type = document`). Same Lexical shape as material `blocks` (`rich_text` · `video`; `body.lexical`).

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| item_id | bigint | FK → OrgResourceItem |
| position | int | order |
| kind | text | `rich_text` · `video` |
| body | jsonb | Lexical JSON in `lexical` for rich text; URL for video |
| file_id | bigint | FK → File, nullable |
| deleted_at | timestamptz | soft delete |

### OrgResourceGrant

Extra access for one org member on one folder **or** one item (XOR).

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| folder_id | bigint | FK → OrgResourceFolder, nullable |
| item_id | bigint | FK → OrgResourceItem, nullable |
| grantee_user_id | uuid | FK → User (active membership required) |
| permission | text | `read` · `write` (write implies read) |

Staff do **not** need grant rows. Unique `(folder_id, grantee)` / `(item_id, grantee)`. Only staff insert/update/delete grant rows; a grantee may SELECT their own row.

**Access presets** (when published, for non-editors):

| access_mode | Who reads |
|-------------|-----------|
| `staff` | Owners, admins, instructors |
| `parents` | Staff + memberships with `role = parent` |
| `members` | All active org memberships |
| `restricted` | Only explicit grants (+ staff editors) |

### Quiz / Form

- **Quiz:** **P0** author + print. Shape = **block on a page** (Lexical `quiz` node; answers on the node). Not a material kind. Not in v1 “Add material” menu. No parallel quiz table; parent access stays enrollment / `parent_student_links`. Online take + autograde is **P1**.
- **Form:** workshop.
### ShareLink

Parent-facing URL. **P0: must be logged in** before the destination is shown.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| token | text | Unique |
| link_type | text | invite · dashboard · **resource** |
| organization_id | bigint | FK → Organization |
| course_id | bigint | FK → Course, nullable |
| student_profile_id | bigint | FK → StudentProfile, nullable |
| material_id | bigint | FK → Material, nullable — set when `link_type = resource` |
| parent_invite_id | bigint | FK → AdminInvite, nullable (parent-role invite when the share was created from one) |
| expires_at | timestamptz | nullable |

**Resource link:** opens that specific material after auth. Same parent access rules (enrolled student, active **published** course, published material).

### ImportantNow / WeeklyContent

- **ImportantNow** table `important_now`: `id`, `organization_id`, `course_id`, `material_id`, `created_by`, `created_at`. Unique `(course_id, material_id)`. Instructor flags on the parent dashboard.
- **WeeklyContent:** not stored — materials whose **effective** dates fall in the current week, **Sunday–Saturday**.
  - Effective assignment date = `Material.scheduled_date` when set; otherwise the parent unit’s `start_date`/`end_date` range when the material has a unit and that range is set.
  - A material appears on This week when its assignment date falls in the week **and/or** its `due_date` falls in the week.
  - Top-level materials (`unit_id` null) without `scheduled_date` are not “assigned” for the week unless they have a `due_date` in range.

### LessonPlan

A course-scoped **weekly plan** for one Sunday–Saturday week. Instructors write an optional week note, optional notes for each day, and may attach same-course materials to a day. **Published / unpublished** controls whether families can see it (same as materials). **Not** an assignment object and **not** email. Replaces bulletins.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| course_id | bigint | FK → Course |
| week_start | date | Sunday of the week this plan covers |
| title | text | required; new form defaults to `This week in <course title>` |
| week_note | text | optional whole-week note (empty string when unset) |
| visibility | text | **`unpublished`** (instructors/admins) · **`published`** (enrolled parents). New plans default unpublished |
| created_by | uuid | FK → User (`profiles`) |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | soft delete |
| deleted_by | uuid | FK → User, nullable |

Unique `(course_id, week_start)` among non-deleted rows. `week_start` must be a Sunday.

Staff who can manage the course always see non-deleted plans (including unpublished). Families SELECT a plan only when the course is parent-viewable **and** `visibility = published` **and** `deleted_at is null`.

Course-from-course copy does **not** copy lesson plans.

### LessonPlanDay

One calendar day inside a lesson plan.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| lesson_plan_id | bigint | FK → LessonPlan |
| day_date | date | must fall in that plan’s Sunday–Saturday week |
| body | text | optional day’s plan text |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Unique `(lesson_plan_id, day_date)`. Persist only days that have body text or materials.

### LessonPlanDayMaterial

Join: materials listed under a lesson-plan day, ordered.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| lesson_plan_day_id | bigint | FK → LessonPlanDay |
| material_id | bigint | FK → Material — must belong to the **same course** as the plan |
| position | int | order under that day |
| created_at | timestamptz | |

Unique `(lesson_plan_day_id, material_id)`. Families only follow links to **published** materials (same material RLS). Attaching a material does **not** change `scheduled_date` or `due_date`. Soft-deleting a plan leaves join rows; the app path does not hard-delete lesson plans.

### Event

A calendar item for **one course**, **one or more classes**, or the **whole organization** (no course and no class). Not a course material. One row is the event everywhere it appears. **Location** is optional. Optional end date (inclusive) and optional start/end times. No repeat.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| audience | text | `course` · `class` · `organization` |
| course_ids | bigint[] | The one course when `audience = course` (cardinality = 1); else `{}` |
| class_ids | bigint[] | Class targets when `audience = class` (cardinality ≥ 1); else `{}` |
| title | text | required |
| location | text | optional, trimmed, at most 200 characters |
| starts_on | date | required — first calendar day (inclusive) |
| ends_on | date | nullable — last day (inclusive); null means `starts_on` only; must be ≥ `starts_on` |
| start_time | time | nullable — local clock time, no time zone |
| end_time | time | nullable — requires `start_time`. On a single day, must be ≥ `start_time` |
| created_by | uuid | FK → User |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | soft delete |
| deleted_by | uuid | FK → User, nullable |

**Who can add or edit:** org owners and admins (any course or class in the org, and organization events). An instructor for a course they can manage, any class in the org, or an organization event (`is_org_staff`).

**Who can read:** owners and admins. Instructors for a course event on a course they manage, class events in the org, and organization events. Parents when a linked student is enrolled in the course (active + published) or is a member of a target class. Organization events are visible to every active member of the organization. Saving shows the event on those calendars. No separate publish flag. No email or Activity.

**Calendar:** the event occupies each date from `starts_on` through `ends_on`. Month and week show a title chip. Day view shows start/end time when set, and the location. A course event uses that course color and follows the legend. Class events and organization events are not hidden by the course legend.

### EventBlock

Ordered write-up on an event. Same block kinds as a page material (`rich_text` · `video`). Quiz and in-page files live in Lexical JSON. Soft-delete only.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| event_id | bigint | FK → Event |
| position | int | |
| kind | text | `rich_text` · `video` |
| body | jsonb | Lexical JSON in `lexical` for rich text; URL for video |
| file_id | bigint | nullable FK → File |
| deleted_at | timestamptz | |
| created_at / updated_at | timestamptz | |

### EventMaterial

Join: existing course materials linked from an event. A course event may only link materials from that course. Class and organization events may link materials in the same organization that the editor can manage. Families only open materials they can already see.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| event_id | bigint | FK → Event |
| material_id | bigint | FK → Material |
| position | int | |
| created_at | timestamptz | |

Unique `(event_id, material_id)`. Replacing the list deletes join rows. Soft-deleting the event leaves them; the app does not hard-delete events.

### Announcement

A **one-way** notice to one or more targets of a single audience kind: **course(s)**, **class(es)**, or **student(s)**. Families see it on the parent/student home while it is current. Opening it writes an `AnnouncementRead` and clears the notification icon. **Not** a lesson plan (no attached materials) and **not** a discussion thread (**P1 Discussions**).

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| audience | text | `course` · `class` · `student` |
| course_ids | bigint[] | Course targets when `audience = course` (cardinality ≥ 1); else `{}` |
| class_ids | bigint[] | Class targets when `audience = class` (cardinality ≥ 1); else `{}` |
| student_profile_ids | bigint[] | Student targets when `audience = student` (cardinality ≥ 1); else `{}` |
| title | text | required |
| body | text | optional note (empty string when unset) |
| start_date | date | nullable — first local calendar day on home (inclusive) |
| end_date | date | nullable — last local calendar day on home (inclusive); when both dates are set, must be ≥ `start_date` |
| created_by | uuid | FK → User (`profiles`) |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | soft delete |
| deleted_by | uuid | FK → User, nullable |

**Audience:** exactly one kind (`audience`), with one or more IDs in the matching array and the other arrays empty. All target IDs must belong to the same organization.

**Homepage visibility:** app uses the viewer’s **local calendar date**. Current = `(start_date` is null or today ≥ start`)` and `(end_date` is null or today ≤ end`)`. No dates means current until staff remove it. Staff always see non-deleted announcements (including upcoming and ended). Date window **is** homepage availability — no separate publish column.

**Who can post:** org owners and admins (any audience in the org). Instructors for courses they can manage (every selected course), or for a class / student they can already manage on the roster (`is_org_staff`).

**Who can read:** staff in the org. Parents (via `parent_student_links`) and student accounts (via `student_profiles.user_id`) when the notice applies to that student: enrolled in **any** of the **courses** (active + published), **or** a member of **any** of the **classes**, **or** listed as **any** of the **students**. Class membership can surface a class announcement even without a course enrollment. Materials / this-week / print stay enrollment-gated.

**Email and Activity:** not stored on the announcement row. Staff may opt in to **Send notification** on save; Edge Function `send-announcement-notification` emails claimed family accounts only (`parent_student_links` → `profiles.email` with an active org membership) for affected students — one Resend `announcement-notification` event per unique address — and calls `notify_announcement` so those same accounts (except the sender) get one Activity row. A later send updates that row. Pending invites and `student_email` contact fields are not mailed or pinged. Payload includes a truncated audience preview (`audience_summary`) and the full target list (`audience_list`).

Course-from-course copy does **not** copy announcements.

### AnnouncementRead

Per-user receipt that the person opened the announcement. Unique `(announcement_id, user_id)`.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| announcement_id | bigint | FK → Announcement |
| user_id | uuid | FK → User (`profiles`) — the reader |
| read_at | timestamptz | |

Parents and students insert their own row when they open the notice. That clears the notification icon for them only (two parents each have their own unread state). Soft-deleting an announcement leaves read rows; the app path does not hard-delete announcements.

---

## Core entities — P1

CourseSummary, Grade, InstructorNote, ChecklistItem. **OrgSubscription** = Course Wright charging the org.

**Discussions** (in progress — product rules in [FEATURES.md](../FEATURES.md)): a two-way thread for **one course** or **one class**. Distinct from announcements.

### Discussion

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| audience | text | `course` · `class` |
| course_id | bigint | FK → Course when `audience = course`; else null |
| class_id | bigint | FK → Class when `audience = class`; else null |
| title | text | required |
| created_by | uuid | FK → User (`profiles`) — the person who started it |
| notify_all | boolean | default false — opening post also notifies everyone who can see the thread; staff create only |
| last_message_at | timestamptz | denormalized last non-deleted message time (list sort); set by trigger |
| answered_at | timestamptz | nullable — set when marked answered |
| answered_by | uuid | FK → User, nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | soft delete |
| deleted_by | uuid | FK → User, nullable |

**Audience:** exactly one kind, with exactly **one** matching FK and the other null. The course or class must belong to the same organization. Audience cannot change after insert.

**Answered:** `answered_at` / `answered_by` set together; cleared together to unmark. Does **not** lock posting. Who may update these columns: `created_by`, or org staff who can see the row.

**Who can insert:** org owners/admins (any course/class in the org). Instructors for a course they teach, or a class they can already manage on the roster (`is_org_staff` class rule — same as announcements). Parents (linked student) and student accounts (own profile) for a course that student is enrolled in (`status = active`, `visibility = published`) or a class that student is a member of.

**Who can read:** org staff (all non-deleted discussions in the org). Parents (and invited student emails) when it applies to a linked student: enrolled in that **course** (active + published), **or** a member of that **class**. Class membership can surface a class discussion even without a course enrollment. Materials / this-week / print stay enrollment-gated. The discussions SELECT policy must use the new row’s audience columns (not a re-query by `id`) so PostgREST `INSERT … RETURNING` succeeds for a parent who is allowed to start the thread.

**Members list:** RPC `list_discussion_members(discussion_id)` returns people who can currently see the thread (org staff + qualifying parents). Callable by anyone who can SELECT the discussion; security definer so parents can see the full list.

**Who can soft-delete the discussion:** org staff only.

Course-from-course copy does **not** copy discussions. No versions table — soft-delete only (not course content).

**Realtime:** include `discussions` in the `supabase_realtime` publication. RLS still applies to change payloads.

### DiscussionMessage

A post on a discussion. The thread is a **flat** conversation (oldest → newest). Optional **Quote** is Teams-style content **inside** `body` (not separate columns / FKs). Composer defaults to **plain text**; a **T** control turns on a **Lexical** rich-text editor for that post.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| discussion_id | bigint | FK → Discussion |
| author_id | uuid | FK → User (`profiles`) |
| body | text | Plain text **or** JSON `{ v:1, format:"plain"\|"lexical", text?\|lexical? }`. Teams-style **Quote** is a Lexical `quote` block inside `lexical` (legacy `quote` field still reads and is folded into Lexical on parse) |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | soft delete |
| deleted_by | uuid | FK → User, nullable |

Check: `body` trimmed non-empty **or** the message has ≥ 1 attachment (enforce with trigger after attachments insert, or require body on insert and allow attachment-only via a follow-up write — implementation must not leave an empty root post). Prefer: opening post is inserted with the discussion; attachments added immediately after.

**Who can insert:** anyone who can SELECT the parent discussion.

**Who can edit body:** the author, while the message is not soft-deleted. Attachments are not rewritten in this slice.

**Who can soft-delete:** the author (own row) or org staff.

Creating a discussion writes the `Discussion` row **and** the first root `DiscussionMessage` in the same user action (PostgREST two-step is OK; hide threads with zero non-deleted messages from lists).

**Realtime:** publish `discussion_messages`.

### DiscussionMessageMention

Join: people @mentioned in a post. Written by the client after the message insert, and again when the author edits the body (upsert; existing `(message_id, user_id)` rows are left alone). A trigger writes Activity rows for newly mentioned members who can currently see the thread (never the author). Unique `(message_id, user_id)`.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| message_id | bigint | FK → DiscussionMessage |
| user_id | uuid | FK → User (`profiles`) — the mentioned person |
| created_at | timestamptz | |

**Who can insert:** the message author, while the message is not soft-deleted. The mentioned person must currently be able to see the thread, and must not be the author.

**Who can read:** anyone who can SELECT the parent message.

No client UPDATE/DELETE in this slice.

**RPC:** `list_discussion_audience_members(organization_id, audience, course_id, class_id)` returns the same people as `list_discussion_members` for a thread that does not exist yet. Callable by someone allowed to start that discussion.

### DiscussionMessageAttachment

Join: files, materials, or URLs on a message.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| message_id | bigint | FK → DiscussionMessage |
| kind | text | `file` · `material` · `url` |
| file_id | bigint | FK → File when `kind = file`; else null |
| material_id | bigint | FK → Material when `kind = material`; else null |
| url | text | when `kind = url` |
| label | text | optional display label (URL or material override) |
| position | int | order on the message |
| created_at | timestamptz | |

Check: exactly one of `file_id` / `material_id` / `url` according to `kind`. File must be in the same org. Material must be **published** and the poster must already be allowed to SELECT it (course materials RLS). Soft-deleting a message leaves attachment rows; the app path does not hard-delete.

**File read:** a user may SELECT a `File` (and its Storage object) if they can SELECT a discussion message that attaches it, **or** via existing material references. Storage policies must match.

**Realtime:** publish `discussion_message_attachments` (or refetch attachments when a message insert arrives).

### DiscussionRead

Per-user cursor for unread. Unique `(discussion_id, user_id)`.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| discussion_id | bigint | FK → Discussion |
| user_id | uuid | FK → User (`profiles`) |
| last_read_at | timestamptz | |

Unread = discussion is visible, not deleted, and (`last_read_at` is null or `last_message_at` > `last_read_at`). Opening the thread upserts `last_read_at = now()`; while the thread is open, live new messages also advance `last_read_at` for that person. Two parents each have their own unread state.

### Notification

Per-user **Activity** row. Discussion rows are written by a trigger on `discussion_messages` insert (SECURITY DEFINER). Announcement rows are written by `notify_announcement` (service role) when staff **Send notification**. Clients **SELECT** their own rows and **UPDATE** `read_at` to ack. No client INSERT.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| user_id | uuid | FK → User (`profiles`) — the recipient |
| kind | text | `discussion_message`, `discussion_mention`, or `announcement` |
| discussion_id | bigint | FK → Discussion when kind is discussion |
| discussion_message_id | bigint | FK → DiscussionMessage |
| announcement_id | bigint | FK → Announcement when kind is `announcement` |
| actor_id | uuid | FK → User — who posted or sent |
| title | text | Discussion or announcement title |
| preview | text | Truncated post or announcement text (or a short fallback) |
| audience_label | text | Course title, class name, or announcement targets |
| created_at | timestamptz | |
| read_at | timestamptz | nullable — set when the person acks (click Activity). Opening the thread acks `discussion_message` only. Opening the announcement acks `announcement` |
| unique | (user_id, discussion_message_id); one `discussion_message` row per (user_id, discussion_id); one `announcement` row per (user_id, announcement_id) | |

**Who is notified:** course **instructors** for a course thread; class **leads** for a class thread; the person who **started** the thread; anyone who **already posted** in it; **@mentioned** people who can currently see the thread; never the author. One `discussion_message` Activity row per person per discussion (later posts update that row, including `discussion_message_id` → latest post, and clear `read_at`). If `discussions.notify_all` is true on the opening post and the starter is staff, also notify everyone `discussion_audience_people` returns (org staff + qualifying parents). An **@mention** on a post or edit writes (or upgrades) a `discussion_mention` row for that person when they are on the thread. **Send notification** on an announcement writes one `announcement` row per claimed family account for the affected students (active org membership; not the sender). A later send updates that row.

**Who can read/update:** `user_id = auth.uid()`. Client update may only change `read_at`. A mention trigger may upgrade `kind` from `discussion_message` to `discussion_mention` and clear `read_at` so the mention is unread.

**Realtime:** publish `notifications`. RLS still applies to change payloads.

**Device notification:** an insert, or an update that leaves the row unread and changes what the person would see, queues `send-activity-push` (best-effort). Acks do not. Delivery needs Vault secrets (**HN-018**); without them the Activity write still commits.

### PushSubscription

One Web Push endpoint for an installed app. The signed-in person saves their own row. `claim_push_subscription` moves an endpoint to the current person when someone else signs in on that device.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| user_id | uuid | FK → User (`profiles`) |
| endpoint | text | Push service URL. Unique |
| p256dh | text | Client public key |
| auth | text | Auth secret |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Who can read/write:** `user_id = auth.uid()` for select, insert, update, and delete. The service role reads them to send. Not in Realtime.

### Feedback

Signed-in **Send feedback** notes. The SPA inserts a row via PostgREST. Not a support ticket queue in the product UI.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| user_id | uuid | FK → User (`profiles`) — author |
| organization_id | bigint | nullable FK → Organization (when submitted from org chrome) |
| name | text | Copied from profile at submit |
| email | text | Copied from profile/session |
| org_name | text | nullable snapshot |
| org_slug | text | nullable snapshot |
| role | text | nullable snapshot of membership role label |
| page_path | text | path when they opened the form |
| message | text | required, max 8000 |
| user_agent | text | optional |
| created_at | timestamptz | |

**Who can insert:** `user_id = auth.uid()`; `organization_id` null or an org they belong to. **SELECT** own rows. No client update/delete.

**P2:** parent-pay / tuition — stub only.

---

## Relationship sketch

**P0:**

```
Organization ──< Membership >── User (admin, instructor, parent)
Organization ──< AdminInvite
Organization ──< StudentProfile
Organization ──< Family ──< FamilyMember >── StudentProfile / User (parent)
Organization ──< Class ──< ClassMember >── StudentProfile
Organization ──< Class ──< ClassLeader >── User (owner / admin / instructor)
Organization ──< StudentProfile ──< Enrollment >── Course (status = active)
Organization ──< ParentInvite ──> StudentProfile
User (parent) ──< ParentStudentLink >── StudentProfile

Organization ──< CourseTemplate ──< TemplateAccess >── User
Organization ──< File ──< FileVersion
Organization ──< Course ──< Unit ──< Material (optional)
Organization ──< Course ──< Material (top-level, unit_id null)
Material (page|link|file)
  └── (if page) Block ──> File?
Material(file) ──> File
Material ──< MaterialVersion
Material ──< MaterialSubmission ──< MaterialSubmissionVersion ──< MaterialSubmissionFile ──> File
Course ──> CourseTemplate (optional; **P1**)
Course / CourseTemplate.grade_levels (catalog metadata)
Course ──< CourseInstructor >── User (instructor)  ← many
Course ──< ImportantNow
Course ──< LessonPlan ──< LessonPlanDay ──< LessonPlanDayMaterial >── Material
Organization ──< Announcement (course(s) | class(es) | student(s)) ──< AnnouncementRead >── User
Course ──< ShareLink
```

**P1 (additive):**

```
Organization ──< Discussion (one course | one class)
Discussion ──< DiscussionMessage (flat; body may include Teams-style quote)
DiscussionMessage ──< DiscussionMessageAttachment >── File | Material | url
DiscussionMessage ──< DiscussionMessageMention >── User
Discussion ──< DiscussionRead >── User
Organization ──< Notification >── User
User ──< PushSubscription
User ──< Feedback >── Organization?
```

**Open:** Course ↔ Class link (enroll class, enroll individuals, or both).

**P2 (additive):**

```
StudentProfile.user_id → User (student account linked to existing profile)
Course ──< Quiz ──< Submission (quiz attempt — not a material submission)
Family cross-org management (extends P0 org Family)
```

---

## Open schema questions

| Question | Impact | P0 lock |
|----------|--------|---------|
| Course ↔ Class enrollment model | Enrollment, Class, Course roster UX | **Workshop** — keep student↔course enrollment until decided |
| `copied_from_course_id` on Course | Origin tracking for course-from-course | **Migrated** (informational; no sync) |
| Add material kinds page · link · file | Material.kind | **Decided** (v1) |
| Rich-text block canonical store | Block.body | **Lexical JSON** (`body.lexical`) |
| Video block: URL vs uploaded file | Block, File, players | **Open** |
| Quiz / Form shape | Block on a page vs later material kind | **Quiz = page block** (Lexical node). Form unused |
| Autograde answer storage + attempt model | QuizAttempt (phase TBD) | P1 |
| SaaS packaging (per teacher vs per course) | OrgSubscription | P1 |
| Assignment object shape | Next conversation | Not P0 |
| Parent visibility after enrollment ends | Membership stays active; what they still see | Deferred |
| Material visibility published / unpublished | Parents (and future students) see published only | **Decided** — unpublished = instructors/admins |
| Course visibility published / unpublished | Parents see a course only when active **and** published | **Decided** — unpublished = instructors/admins; new courses unpublished |
| Course description, location, subject | Catalog fields on Course | **Decided** — optional free text; description ≠ P1 Summary |
| Family profile fields beyond names | Family, FamilyMember | P0 UI: family display name + student names; parents derived from links. Extra fields TBD |
| Course `grade_levels` storage (array vs join table vs range columns) | Course, CourseTemplate, search facets | **`text[]`** |
| Search: FTS columns vs materialized search document | Indexes, PostgREST views | **Generated `tsvector` + GIN** on searchable tables |
| Template product surface | CourseTemplate, TemplateAccess, sync Functions | **P1** — tables may exist; no P0 UI |
| Discussion audience beyond one course or one class | Discussion | **Later** — ad-hoc student-group audience not in this slice |
| Material kinds page/link/file + Block rows | materials, blocks | **Migrated** in baseline |

---

## Implementation notes

**Stack:** [STACK.md](../STACK.md) — Supabase (Postgres + PostgREST + Auth + Storage + Functions), React, Tailwind, TanStack, Zustand, **PostHog**; frontend on **AWS S3 + CloudFront** (Terraform).

- Prefer **PostgREST from the frontend** for CRUD; **Supabase Functions** for complex multi-step / privileged operations.
- **Auth:** Supabase Auth — email + Sign in with Google (Google Cloud OAuth). `profiles` is created by a trigger on `auth.users`.
- **Files:** Supabase Storage bucket `org-files`; `File.storage_ref` is `{organization_id}/{file_id}/{version_id}/{filename}`. Audio/video playback in the SPA for those mime types.
- **Search:** generated `search_vector` columns + GIN indexes; facets are ordinary columns (`course_id`, `kind`, `mime_type`, `grade_levels`, …) filtered under the same RLS.
- **Analytics:** PostHog (client) — not a schema entity.
- Access control via **RLS** (and Storage policies) aligned with Membership roles and parent access rules above. Parent SELECT of a course requires a `ParentStudentLink`, an active `Enrollment`, `Course.status = active`, and `Course.visibility = published` (active org membership; role need not be `parent`). **Family membership is not part of that gate.** Parents (and future students) SELECT materials only when `visibility = published` **and** they can view the course. Instructors SELECT unpublished courses and materials only for courses they teach; owners/admins see all. **P1 discussions:** publish selected tables on `supabase_realtime`; Realtime payloads must still pass the same RLS. Discussion-attached files are readable when the actor can SELECT the attaching message.
- **Migrations:** `supabase db migrate` — see [STACK.md](../STACK.md).
- **ID format:** App entities use **`bigserial` / `bigint`**. Auth-linked ids (`profiles`, FKs to `auth.users`) stay **`uuid`**. Baseline migrations match this convention.
