# COURSE_GRADEBOOK

**URL:** `/my/<org-slug>/courses/<course_id>/gradebook`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff who can manage the course (an instructor on that course, or an org owner/admin). Other people do not get this route.

## Purpose

One workbench for a course: see who still needs a grade, set quiz points, and set the course final.


## Behavior

- One score path. Quiz points stay on the attempt (`auto_points` / `teacher_points`). **Save grade** uses the same lock as the quiz page (`teacher_graded_at`), with an optional note stored only on the override audit.
- Display labels are derived from the org grading scale. Mode `none` shows percents and hides the letter override controls.
- **Needs a grade** lists attempts that are not teacher-locked. Opening one loads the answers and **Save grade**.
- The student list is one collapsed row per active enrollment. Each row shows quiz progress and the course final. Expanding it shows every course quiz and the final controls; attempted quizzes open the same Save grade form.
- **Final** is the unweighted mean of locked percents (points possible 0 and unlocked attempts stay out). When mode is letter or pass/fail, the teacher can save an override label plus a note. The row shows who saved it and when. **Use the average** clears the override.
- A class filter only hides rows. It does not store a class grade.
- If the scale changes after an override, a banner asks the teacher to confirm. Overrides are not wiped.
- **Draft report cards** creates one draft per active enrollment (Pattern B). Review opens [REPORT_CARD](./REPORT_CARD.md). Send happens one card at a time from that page.

## Data shown

- Course title
- Class filter (roster convenience)
- Needs-a-grade queue: student, quiz title
- Student rows: student, attempted quiz count, needs-grade count, final percent or override
- Expanded student details: every course quiz (grade, “Needs grade,” or no-attempt dash) and final controls
- Override stamp: actor name and time
- Report card drafts: student, status

## Contents

- Needs a grade
- Save grade form (points + optional note)
- Expandable student rows
- Report card drafts

## Primary actions

- Filter by class
- Save grade
- Save final / use the average
- Draft report cards
- Open a draft to review
- Open the student

## Links to

- [COURSE](./COURSE.md) — back
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — student name
- [REPORT_CARD](./REPORT_CARD.md) — review or open a card
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Progress — grading. No category weights, no bulk send, no second score table.
