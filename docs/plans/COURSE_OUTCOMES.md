# Course outcomes — learning goals and ratings

**Status:** in design  
**Prerequisite for:** [REPORT_CARDS.md](./REPORT_CARDS.md) (optional template section)  
**Domains:** new `src/outcomes/` (or under `src/courses/` + org settings) · courses · grading report cards  
**Migrations:** TBD (experiment mode)

## Problem

Teachers need structured learning goals beyond a single course final: “After this course, you’ll be able to ___,” optionally broken into measurable criteria. Organization owners need to control **which rating labels** teachers pick (e.g. N/A, Mastered, Not mastered, In progress) so report cards stay consistent across the org.

**Freeform teacher comments** for a marking period are **not** outcomes — they are **period feedback** in [REPORT_CARDS.md](./REPORT_CARDS.md), so a course with no outcomes can still contribute narrative when the template includes that section.

## Product intent

| Need | Intent |
|------|--------|
| Course outcomes | Each course may define ordered outcomes (goal statements) |
| Criteria (suboptions) | An outcome may have zero or more **criteria** — “measured by X, Y, Z” |
| Org rating scale | **Owners and admins** define the options teachers choose when rating |
| Teacher ratings | Course instructors rate each enrolled student per criterion (or per outcome when there are no criteria) |
| No outcomes on a course | That course is **skipped** for the outcomes section on the report card; the teacher has **no outcomes fill task** for that course |
| Cycle submit | Teachers **submit** an outcomes package for a fill cycle (gaps allowed); soft due date — see report cards plan |
| Family visibility | Parents and the student **read** ratings on Progress / student profile. No family write |

## Locked decisions (this design pass)

| Decision | Lock |
|----------|------|
| Scope of outcomes | **Per course** (not org-wide catalog in v1). Copy-on-course-copy may reuse text; no live sync |
| Hierarchy | Outcome → optional criteria. Rate **each criterion individually** when criteria exist — **no** overall mastery pick on the parent outcome. No criteria → rate the outcome directly |
| Not period feedback | Outcomes do **not** store freeform quarter/week comments. That is period feedback on the report-cards plan |
| Rating options | **Org-defined** ordered list. Separate from letter/pass-fail grading scale |
| Who edits outcomes | Course instructors for courses they manage; owners/admins any course |
| Who edits rating options | **Owners and admins** |
| Who rates | Course instructors for that course; owners/admins |
| Unset | Allowed. Distinct from an explicit N/A option if the org adds one |
| Package submit | Done for a fill cycle when the teacher **submits** the outcomes package — not when every cell is filled |
| Not a gradebook mean | Ratings do not enter the unweighted quiz/material final |
| Parents / students | **Read** on Progress and student profile. No write |

### Example

```text
Course: Intro Biology
└── Outcome: "Explain how cells produce energy"
    ├── Criterion: "Describe mitochondria's role"
    ├── Criterion: "Contrast aerobic vs anaerobic respiration"
    └── Criterion: "Interpret a simple energy diagram"
Org rating options: N/A · Not mastered · In progress · Mastered
```

Teacher picks one org option **per criterion**. Period feedback (prose) is a separate fill elsewhere.

## Org rating options

Surface: Org settings — **Outcomes** tab (or under Grading); **owners and admins** write.

| Field | Notes |
|-------|-------|
| label | Display string (“Mastered”) |
| sort_order | |
| is_active | Soft-hide without breaking historical ratings |

Seed suggestion: `N/A`, `Not mastered`, `In progress`, `Mastered`.

Submitted report-card snapshots keep label text from send time.

## Course outcomes & criteria

### Outcome

| Field | Notes |
|-------|-------|
| course_id | FK |
| organization_id | FK |
| statement | text |
| sort_order | |
| archived_at | optional |

### Criterion

| Field | Notes |
|-------|-------|
| outcome_id | FK |
| statement | text |
| sort_order | |

## Student ratings

| Field | Notes |
|-------|-------|
| course_id + student_profile_id (or enrollment_id) | **TBD** historical after unenroll |
| fill_cycle_id | ratings belong to a cycle when used for report cards |
| outcome_id / criterion_id | criterion when criteria exist; else outcome |
| rating_option_id | null = unset |
| rated_by / rated_at | |

**Rule:**  
- Criteria present → one rating row per **criterion** only.  
- No criteria → one rating row per **outcome**.  
- Course with zero outcomes → no rows; card skips; no fill task.

## Capture UX

| Surface | Behavior |
|---------|----------|
| Course settings / Outcomes | CRUD outcomes and criteria; reorder |
| Fill UI (from home to-do) | Matrix for the cycle; **Submit package** when ready |
| Student profile / Progress | Ratings read |
| Org settings | Rating option list |

## RLS sketch

- Rating options: members read; owners/admins write.
- Outcomes/criteria: course managers write; staff read for visible courses.
- Ratings: gradebook-like write; parents/students SELECT linked/own.

## Out of scope

- Standards framework imports  
- Rubric points in the gradebook mean  
- Org-wide outcome library  
- Period feedback / fill-cycle UI (report cards plan)  
- Template builder  

## Open questions

1. Copy outcomes when “create course from another course”?  
2. Soft max length on anything? (ratings are picks only)  

## Implementation checklist

1. FEATURES + SCHEMA; status → `in progress`  
2. Org rating options + course outcomes/criteria CRUD  
3. Rating matrix + cycle package submit (wired to fill cycles)  
4. Snapshot helper for report cards  
5. Status → `shipped`  

## References

- [REPORT_CARDS.md](./REPORT_CARDS.md)  
- [ATTENDANCE.md](./ATTENDANCE.md)  
- [FEATURES.md](../FEATURES.md)  
- [SCHEMA.md](../database/SCHEMA.md)  
