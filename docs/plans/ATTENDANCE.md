# Attendance — capture at class and course

**Status:** in design  
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
| Who reads (staff) | Owners/admins org-wide. Instructors see class sheets for classes they lead and course sheets for courses they teach. Broader “any instructor sees any class” stays **TBD** (default: same manage rules as roster discussions) |
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
| Class roster / class attendance | Date picker (default today). Grid of class members × status. Save per student or batch. Show day badge if set. Hint when other sheets exist that day |
| Course roster / course attendance | Same pattern for **active enrollments** |
| Student profile | Timeline or calendar; who recorded what; **day status** control (present / absent / excused / partial) |
| Day mark | Student profile or staff “Attendance today” — set/clear whole-day status without opening every sheet |
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
| student_profile_id | FK — must be class member at write time (or allow historical after leave — **TBD**) |
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

1. After a student leaves a class, do historical class entries stay readable?
2. Should instructors who are not class leads see other classes’ sheets for students they teach?
3. Date range defaults for report rollup (term dates vs course start/end vs free picker on the card)?
4. Optional note on a day or sheet entry (e.g. “left at noon”) in v1?

## Implementation checklist (when building)

1. SCHEMA + FEATURES rows; status → `in progress`
2. Migration + RLS + helpers
3. `src/attendance/` databridge + AGENTS.md
4. Class and course capture UI
5. Day status control on student profile (present / absent / excused / partial)
6. Progress / parent + student read
7. Cycle attendance package submit (wired to report-card fill cycles)
8. Export helpers for report-card snapshot
9. Status → `shipped` in FEATURES; mark this plan shipped

## References

- [FEATURES.md](../FEATURES.md) — Classes, Progress — grading  
- [SCHEMA.md](../database/SCHEMA.md) — Class, ClassLeader, Enrollment, CourseInstructor  
- [REPORT_CARDS.md](./REPORT_CARDS.md)  
- [COURSE_OUTCOMES.md](./COURSE_OUTCOMES.md)
