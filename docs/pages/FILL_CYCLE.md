# FILL_CYCLE

**URL:** `/my/<org-slug>/fill-cycles/<cycle_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff. Owners and admins close, reopen, and remind. Instructors and class leads see the packages they are allowed to count.

## Purpose

Show how far a fill cycle has gotten, and send people to the gradebook, attendance sheet, or outcomes matrix for what is still open.


## Behavior

- Shows “N of M packages submitted.” M is the packages this person may count, from `fill_cycle_scope`.
- Missing packages link to the fill screen with `?cycle=` on the URL.
- Owners and admins close or reopen the cycle. Closed blocks new package submits. Grades, attendance marks, and outcome ratings that are not tied to a closed cycle stay editable.
- **Remind staff** writes a home reminder for each instructor or class lead who still has an open package. It does not send email and does not write Activity.
- Past due is a label only.
- A person with nothing in scope sees that nothing is assigned to them.

## Data shown

- Cycle name, due date, open or closed
- Finished and total package counts
- Each missing package: kind and course or class title

## Contents

- Progress line
- Close / reopen
- Remind staff
- Missing package list

## Primary actions

- Open a missing package
- Close or reopen
- Remind staff

## Links to

- [FILL_CYCLES](./FILL_CYCLES.md)
- [COURSE_GRADEBOOK](./COURSE_GRADEBOOK.md), [COURSE_ATTENDANCE](./COURSE_ATTENDANCE.md), [CLASS_ATTENDANCE](./CLASS_ATTENDANCE.md), [COURSE_OUTCOME_RATINGS](./COURSE_OUTCOME_RATINGS.md), [PERIOD_FEEDBACK](./PERIOD_FEEDBACK.md) — with `?cycle=`

## Notes

[FEATURES.md](../FEATURES.md) — Report card templates (fill-cycle slice). Soft due. Manual reminders only.
