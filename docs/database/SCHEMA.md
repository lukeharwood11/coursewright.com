# Course Wright — Schema (Draft)

> **Status:** Baseline matches `supabase/migrations/` post-squash (`bigserial`/`bigint` app IDs; materials `page`|`link`|`file`; `blocks`; `classes`/`class_members`; `copied_from_course_id`). Product rules stay in this file. **P0** = course builder (**courses only** — Material = page of **blocks**), **classes** (student groups), org management, roster, RBAC, file sharing, parent access, **extreme shareability**. **Course templates** are **P1**.

---

## SQL mapping (P0)

Runtime tables are snake_case of the entities below. Applied by [supabase/migrations/](../../supabase/migrations/). Do not add entities that are not in this document.

| SCHEMA entity | Table | Notes |
|---------------|-------|--------|
| User | `profiles` | PK = `auth.users.id`. Email + Google live in Supabase Auth; `profiles` is the PostgREST-facing row. |
| Organization | `organizations` | |
| Membership | `memberships` | |
| AdminInvite | `admin_invites` | Unified email-claim invite. Role payload: `owner` / `admin` / `instructor` / `parent`. Claimed via copyable `/invite/<token>` or pending-request inbox after login. **v0: no email send.** Membership is created on claim. |
| StudentProfile | `student_profiles` | |
| Family | `families` | |
| FamilyMember | `family_members` | |
| ParentInvite | `admin_invites` (`role = parent`) | Same token table as staff. `student_profile_id` required for parent. Separate `parent_invites` table retired. |
| ParentStudentLink | `parent_student_links` | |
| Enrollment | `enrollments` | |
| Course | `courses` | P0 |
| Class | `classes` | **P0** — group of students; **not** a course |
| ClassMember | `class_members` | **P0** — student_profile ↔ class |
| CourseTemplate | `course_templates` | **P1** product — table exists |
| TemplateAccess | `template_access` | **P1** product — table exists |
| CourseInstructor | `course_instructors` | |
| Unit | `units` | |
| Material | `materials` | page · link · file; `unit_id` nullable (top-level) |
| Block | `blocks` | Ordered content on a page material (`rich_text` · `video`; quiz lives as a Lexical node in rich-text `body.lexical`) |
| MaterialVersion | `material_versions` | |
| File | `files` | |
| FileVersion | `file_versions` | |
| ShareLink | `share_links` | |
| ImportantNow | `important_now` | |
| WeeklyContent | *(not a table)* | Derived from material/unit dates (Sunday–Saturday). |
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
| **P0** | Organization, User, Membership, **AdminInvite**, **StudentProfile**, **Class**, **ClassMember**, **Family**, **FamilyMember**, Enrollment, ParentInvite, ParentStudentLink, CourseInstructor, Course, **Unit**, **Material** (page), **Block**, **MaterialVersion**, File, **FileVersion**, ShareLink, ImportantNow, **search indexes / facets**. (**Create course from course** copies units/materials/blocks — Function candidate.) |
| **P1** | **CourseTemplate**, **TemplateAccess**, template↔course sync/promote/deprecate, CourseSummary, Grade, InstructorNote, ChecklistItem, **OrgSubscription** (Course Wright bills orgs) |
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
2. Does **not** copy roster, enrollments, important-now, or share links.
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

### Student profile creation flow

**Decided:**

1. Instructors (and admins) can add students when managing a course roster.
2. If the student does not yet exist in the org, enrolling them in a course **creates a `student_profile`** under the organization.
3. No `User` account is created for the student in P0/P1.
4. In P2, a student `User` account can be **linked** to an existing `student_profile` via `user_id`.

### CourseInstructor

Multiple instructors per course (co-teaching). **P0.**

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| course_id | bigint | FK → Course |
| user_id | uuid | FK → User (`profiles`) — instructor |
| unique | (course_id, user_id) | Co-teaching; no extra course-role in P0 |

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

**References:** `Material.file_id` and/or page blocks hold `file_id` → `File`. No `File.material_id` owner FK. No `copied_from_id` on File for template copy — copy shares the same id.

Generous types/sizes — keep open. **Audio and video MIME types are first-class** (in-app players in the product). Replacing a file creates a new `FileVersion` + new Storage blob; prior blobs stay for revert. **Replace updates all referrers** unless a fork creates a new `File` (open — FILE_STORAGE).

**Playback:** UI uses `mime_type` (and optionally duration / poster — TBD) to choose audio vs video player. YouTube embeds are not `File` rows — they live in Page blocks.

---

## Search (P0)

Search is a product requirement — schema must support **text + facets**, not only UI filtering of loaded lists.

| Concern | Notes |
|---------|-------|
| **Searchable surfaces** | Material title/body (as indexed), File filename, Course title + description + subject + location, Template title + description, Unit title, StudentProfile name, Family names, instructor names |
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
| org_type | text | `coop` · `micro_school` |
| grade_scheme | text | `k12` · `custom` |
| grade_labels | text[] | Allowed labels for student `grade_level` and course/template `grade_levels`. K–12 preset includes K, 1–12, and common bands (K-2, 3-5, 6-8, 9-12). Custom is org-defined. |

**Permalink:** created with the org (derived from name, uniquified). Owners and admins may edit `slug`; the product **warns** that existing org URLs will break. P0 does **not** require keeping old slugs as redirects.

**Grade scheme:** the org decides how student **and course** grade levels work. Course Wright provides options (exact grade, range, custom). Student `grade_level` and course/template grade metadata must match the scheme when set.

### User

Authenticated users only: admins, instructors, parents. **Not students** (P0/P1). Table: `profiles`; PK is `auth.users.id`.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK = `auth.users.id` |
| email | text | Unique, lowercased; synced from Auth |
| name | text | Display name |
| google_id | text | nullable, unique — Google subject when signed in with Google |

### Membership

Org staff and parent memberships. Owners and admins may **change** `admin` ↔ `instructor` and **remove** admin/instructor memberships. **Cannot** remove or demote the last remaining `owner` or `admin`. These writes touch **`memberships` only**. Course materials and roster stay **enrollment-gated** (and `ParentStudentLink` where applicable) — do **not** add a second staff-role gate on content RLS.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| user_id | uuid | FK → User, **nullable** until invite is claimed |
| role | text | owner · admin · instructor · parent |
| status | text | active · invited · suspended |

### AdminInvite

Unified email-claim invite. **Role is payload:** `owner` / `admin` / `instructor` (staff) or `parent`. **v0:** copy a claim link; Course Wright does **not** send email. Claimed by opening `/invite/<token>` or by signing in with that email and accepting a pending request. **Membership is created on claim.** Parent course access still requires enrollment (see Parent access gate).

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| email | text | Lowercased — must match the account that claims |
| role | text | `owner` · `admin` · `instructor` · `parent` |
| student_profile_id | bigint | FK → StudentProfile, **required when `role = parent`**, else null |
| invited_by | uuid | FK → User |
| token | text | Unique invite token (returned on insert; used in `/invite/<token>`) |
| accepted_at | timestamptz | nullable |
| membership_id | bigint | FK → Membership, nullable |

**Who can invite staff:** owners and admins. Admins may invite `admin` or `instructor`. Only owners may invite another `owner`. Instructors cannot invite org staff.

**Who can invite parents:** owners, admins, and instructors. Parent invites are created from roster / student profile (copy `/invite/<token>`). The Families directory, when routed, may also insert a pending parent row when linking an email with no account.

---

### StudentProfile

Org-level student record. **No dedicated student membership role in P0/P1.** Optional `student_email` may be invited with the parent claim path so that person sees this student's work.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| organization_id | bigint | FK → Organization |
| name | text | **Required** — only required field |
| parent_email | text | **Optional** — first parent email for create/search; more parents via invites + `ParentStudentLink` |
| student_email | text | **Optional** — student contact email; invite uses parent claim path (student role is P2) |
| grade_level | text | **Optional** — must be in org `grade_labels` when set |
| user_id | uuid | FK → User, **nullable** — linked in P2 when student gets an account |
| created_at | timestamptz | |
| created_via_course_id | bigint | FK → Course, nullable — course that triggered first enrollment |

No other student-profile fields in P0 besides optional parent/student emails and grade.

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

Parent-specific fields: `student_profile_id` (required), plus the shared email / token / invited_by / accepted_at columns on AdminInvite.

**v0:** staff copy `/invite/<token>`; no email send. On claim: create parent membership (if needed) and `parent_student_links`. Do **not** grant course access from the invite alone. Unrouted Families directory may also save a pending parent row per chosen student.

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
| template_id | bigint | FK → CourseTemplate, **nullable** — **P1** live link when created from a template; unused in P0 product flows |
| copied_from_course_id | bigint | FK → Course, **nullable** — P0 origin when created from another course (informational, no sync) |
| start_date | date | nullable — informational |
| end_date | date | nullable — informational |
| grade_levels | text[] | **optional** — one or more labels from org `grade_labels` |
| status | text | **active** · archived — offering is running vs archived |
| visibility | text | **unpublished** (instructors/admins) · **published** (enrolled parents; students when that role exists). New courses default unpublished |

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

**Dating:** unit dates and per-material `scheduled_date` are **both optional**. For parent "this week": material `scheduled_date` wins when set; otherwise the unit range applies **if the material has a unit**. Top-level materials need `scheduled_date` to appear in "this week."

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
| scheduled_date | date | **optional** — when set, used for calendar-week dashboard (wins over unit dates) |
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
  - Effective date = `Material.scheduled_date` when set; otherwise the parent unit’s `start_date`/`end_date` range when the material has a unit and that range is set.
  - Top-level materials (`unit_id` null) without `scheduled_date`, and undated materials in undated units, do not appear in "this week."

---

## Core entities — P1

CourseSummary, Grade, InstructorNote, ChecklistItem. **OrgSubscription** = Course Wright charging the org.

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
Course ──> CourseTemplate (optional; **P1**)
Course / CourseTemplate.grade_levels (catalog metadata)
Course ──< CourseInstructor >── User (instructor)  ← many
Course ──< ImportantNow
Course ──< ShareLink
```

**Open:** Course ↔ Class link (enroll class, enroll individuals, or both).

**P2 (additive):**

```
StudentProfile.user_id → User (student account linked to existing profile)
Course ──< Quiz ──< Submission
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
| Material kinds page/link/file + Block rows | materials, blocks | **Migrated** in baseline |

---

## Implementation notes

**Stack:** [STACK.md](../STACK.md) — Supabase (Postgres + PostgREST + Auth + Storage + Functions), React, Tailwind, TanStack, Zustand, **PostHog**; frontend on **AWS S3 + CloudFront** (Terraform).

- Prefer **PostgREST from the frontend** for CRUD; **Supabase Functions** for complex multi-step / privileged operations.
- **Auth:** Supabase Auth — email + Sign in with Google (Google Cloud OAuth). `profiles` is created by a trigger on `auth.users`.
- **Files:** Supabase Storage bucket `org-files`; `File.storage_ref` is `{organization_id}/{file_id}/{version_id}/{filename}`. Audio/video playback in the SPA for those mime types.
- **Search:** generated `search_vector` columns + GIN indexes; facets are ordinary columns (`course_id`, `kind`, `mime_type`, `grade_levels`, …) filtered under the same RLS.
- **Analytics:** PostHog (client) — not a schema entity.
- Access control via **RLS** (and Storage policies) aligned with Membership roles and parent access rules above. Parent SELECT of a course requires an active `parent` membership, a `ParentStudentLink`, an active `Enrollment`, `Course.status = active`, and `Course.visibility = published`. **Family membership is not part of that gate.** Parents (and future students) SELECT materials only when `visibility = published` **and** they can view the course. Instructors/admins see unpublished courses and materials.
- **Migrations:** `supabase db migrate` — see [STACK.md](../STACK.md).
- **ID format:** App entities use **`bigserial` / `bigint`**. Auth-linked ids (`profiles`, FKs to `auth.users`) stay **`uuid`**. Baseline migrations match this convention.
