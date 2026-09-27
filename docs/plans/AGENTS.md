# AGENTS — `docs/plans/`

Implementation plans for in-flight or upcoming work. These are **not** the product behavior source of truth — [FEATURES.md](../FEATURES.md) and [database/SCHEMA.md](../database/SCHEMA.md) are.

## Rules

- Link to the migrations and domains the plan will touch.
- When a plan ships, update FEATURES/SCHEMA status and archive or delete the plan (or mark **Status: shipped** at the top).
- Do not duplicate page-level UX detail that belongs in `docs/pages/`.

## Plans

| File | Topic |
|------|--------|
| [ORG_PROFILES.md](./ORG_PROFILES.md) | Unified org profiles (one person per org: privileges, student context, parent relationships); org-owned name and email; pre-claim config and hard backfill |
| [REPORT_CARDS.md](./REPORT_CARDS.md) | Templates (print format + sections); student-term assemble; fill cycles; period + class-lead feedback |
| [ATTENDANCE.md](./ATTENDANCE.md) | **Prerequisite** — class/course/day capture + cycle attendance package submit |
| [COURSE_OUTCOMES.md](./COURSE_OUTCOMES.md) | **Prerequisite** — course outcomes/criteria + org rating options (not freeform feedback) |
