# Attendance — capture at class and course

**Status:** capture shipped — package submit still waits on report cards  
**UX (US-92):** The class **Attendance** tab is the class-lead home for a selected date (day-level marks and course-sheet corrections in that class). One summary badge per student. The capture outline’s staff “Attendance today” path is superseded by that tab. Course attendance sheets stay the course instructor’s primary write surface. Schema is unchanged.  
**Prerequisite for:** [REPORT_CARDS.md](./REPORT_CARDS.md) (optional template section)  
**Domains:** new `src/attendance/` · roster classes · courses · grading report cards  
**Migrations:** TBD (experiment mode — prefer one coherent migration when implementing)

## Problem

Microschools and co-ops need a simple attendance record that can feed report cards. Capture is not only a course-teacher job: **class leads** often take attendance for a cohort that spans several courses, while a **course teacher** may take attendance for that period only. Staff also need a fast path: mark a student **present for the day** without opening every class or course sheet.

## Product intent

| Need | Intent |
|------|--------|
| Class-level capture | Class leads (and org owners/admins) record attendance for members of that class on a given date |
| Course-level capture | Course instructors (and org owners/admins) record attendance for enrolled students on a given date |
| Shared visibility | Staff who can manage a class or course can **see** attendance already submitted by others for that student/date (class sheet and course sheet stay separate sources, not a silent overwrite) |
| Day mark | Staff with roster authority can set a **whole-day** status without opening every sheet |
| Partial / some classes | Mark attendance on **individual class or course sheets** only (e.g. present in morning class, excused from afternoon). Mixed sheets = partial day in the UI |
| Report cards | Template may include attendance. A fill cycle also requires an **attendance package submit** — a checkpoint to review/fix marks for the cycle window before the card uses them (see [REPORT_CARDS.md](./REPORT_CARDS.md)). Day/class/course capture stays available; submit does not permanently lock edits (soft due) |
| Family visibility | Parents and the student **read** attendance on Progress / student profile. No family write |

## Locked decisions (this design pass)

| Decision | Lock |
|----------|------|
| Attendance exists without report cards | Yes — usable from class and course chrome on its own |
| Two capture scopes | **Class** and **Course** — separate rows / sheets, not one merged write |
| Who writes class attendance | Class **leads** for that class; owners and admins for any class in the org |
| Who writes course attendance | **Course instructors** for that course; owners and admins for any course in the org |
| Who reads (staff) | Org staff who can browse (owner, admin, instructor, observer) read all three tables in the org. Parents and students read linked / own rows only and do not open the class or course grid |
| Day mark | Explicit **day-level** row on (student, date). Statuses: `present` · `absent` · `excused` · `partial`. Does not delete class/course rows. Whole-day `present` / `absent` / `excused` is the fast path when every period is the same |
| Partial absence / excuse | Supported two ways: (1) day status `partial`, and/or (2) **different statuses on some class/course sheets** the same day (e.g. present in one class, excused in another). Capture UI always shows per-sheet detail; never silently flatten mixed sheets |
| Status vocabulary (v1) | Fixed set on **class/course** entries: `present` · `absent` · `late` · `excused`. On **day** entries: `present` · `absent` · `excused` · `partial`. Unset = no row. Org-custom labels later |
| Granularity | **Calendar date** + per class/course sheet. No clock-in times / period blocks in v1 |
| Class ≠ enrollment | Class membership and course enrollment stay independent. A student may appear on a class sheet and not on a course sheet the same day |
| Parents / students | **Read** on Progress and student profile (ship with capture). No family write |
| Not a grade | Attendance is not part of the gradebook mean |
| Cycle package submit | For a report-card **fill cycle**, responsible staff **submit** attendance for the cycle date window (complete for home rollup). Marks remain editable after soft due; package can be re-submitted |

## Concepts

```text
Student (org_profiles, counts_as_student)
├── attendance_day          — optional whole-day mark for (student, date)
│                             present | absent | excused | partial
├── attendance_class_entry  — class lead sheet: (class, student, date, status)
│                             present | absent | late | excused
└── attendance_course_entry — course teacher sheet: (course, student, date, status)
                              present | absent | late | excused
```

### Resolution for “were they here?”

For a single student on a date:

1. Always show **class and course sheet rows** that exist (staff and family detail views). Mixed sheets are the source of truth for “some classes.”
2. If a **day** row exists, show it as the day summary badge (`Present` / `Absent` / `Excused` / `Partial`).
3. If there is **no** day row but sheets disagree (e.g. present + excused), treat the day summary as **Partial** in lists and report rollups.
4. If there is no day row and every sheet agrees (or only one sheet), that status is the day summary.
5. Whole-day `present` / `absent` / `excused` does **not** require filling every sheet; sheets may still be added later for detail.

**Proposed report rollup:** counts in the window for Present / Absent / Excused / Partial / Late (late from sheets only). Detail list optional via template option later.

## Capture UX (implementation outline)

| Surface | Behavior |
|---------|----------|
| Class → Attendance tab | Class-lead home (owners and admins acting on that class too). Date defaults to today. **Day** marks for the cohort, and course sheets tied to that class (active enrollments of its members) can be corrected without leaving the class. One day summary badge per student — never a day chip beside a sheet chip. An explicit day mark wins and is labeled day mark. Otherwise disagreeing or incomplete sheets are Partial, with each sheet status and a link. Clear is its own control. Undo follows a change. Optional Mark all Present. Observers read only |
| Course attendance sheet | Course instructors’ primary write surface. Active enrollments. Sheet statuses only (the day summary badge is read-only here). Clear, undo, and optional Mark all Present. Observers read only |
| Student profile | Today plus recent marked days for staff — unmarked earlier days stay hidden. Day status control for staff who may write it. Clear, not a second click. Family read shows marked days only |
| Day mark | Class Attendance tab, or the student profile for staff who may write that day. Not a separate “Attendance today” screen |
| Partial via sheets | Leave day unset (or set `partial`) and mark only the classes/courses that apply |

Do **not** invent locked routes in this plan. When paths lock, add them to [URLS.md](../URLS.md) + [pages/](../pages/) together.

## Data sketch (planning — not migration SQL)

Names are indicative; final columns land in [SCHEMA.md](../database/SCHEMA.md) when implemented.

### `attendance_statuses` (optional later)

v1 hardcodes the enum in check constraints. Org-custom labels are a later enhancement if report-card templates need them.

### `attendance_days`

| Field | Notes |
|-------|-------|
| organization_id | FK |
| student_profile_id | FK → org_profiles |
| on_date | date |
| status | `present` · `absent` · `excused` · `partial` |
| recorded_by | user_id |
| unique | (student_profile_id, on_date) |

### `attendance_class_entries`

| Field | Notes |
|-------|-------|
| organization_id | FK |
| class_id | FK |
| student_profile_id | FK — new mark requires current class membership. An existing row stays and can still be edited by whoever can write that sheet |
| on_date | date |
| status | `present` · `absent` · `late` · `excused` |
| recorded_by | user_id |
| unique | (class_id, student_profile_id, on_date) |

### `attendance_course_entries`

Same shape with `course_id` and enrollment check at write time.

## RLS sketch

- SELECT: owners/admins; class leads for their class rows; course instructors for their course rows; day rows when the reader can manage that student on the roster (same staff bar as editing the student).
- INSERT/UPDATE/DELETE: same write rules as above; `recorded_by = auth.uid()`.
- Parents/students: SELECT for linked / own student; no write.

## Out of scope (this prerequisite)

- Period/block scheduling, QR check-in, bus/transport
- Automatic absence emails
- Weighted “attendance grade” in the gradebook
- Syncing class membership changes into past attendance rows
- Report-card template UI (lives in [REPORT_CARDS.md](./REPORT_CARDS.md))

## Open questions

Resolved for capture:

1. After a student leaves a class, historical entries stay. A new mark still requires current membership (or an active enrollment on a course sheet). Whoever can write that sheet can still edit the old row.
2. Staff who can browse the org can read every sheet in the org. Writes stay with class leads, course managers, and owners/admins as above. Parents and students do not see other students’ grids.
3. Report rollup date range waits on report cards.
4. No note column in v1.

## Implementation checklist (when building)

1. SCHEMA + FEATURES rows; status → `in progress` — done for capture
2. Migration + RLS + helpers — done
3. `src/attendance/` databridge + AGENTS.md — done
4. Class and course capture UI — done
5. Day status control on student profile (present / absent / excused / partial) — done
6. Progress / parent + student read — done
7. Cycle attendance package submit (wired to report-card fill cycles) — waits on report cards
8. Export helpers for report-card snapshot — waits on report cards
9. Status → `shipped` in FEATURES for capture; package submit stays open

## References

- [FEATURES.md](../FEATURES.md) — Classes, Progress — grading  
- [SCHEMA.md](../database/SCHEMA.md) — Class, ClassLeader, Enrollment, CourseInstructor  
- [REPORT_CARDS.md](./REPORT_CARDS.md)  
- [COURSE_OUTCOMES.md](./COURSE_OUTCOMES.md)
