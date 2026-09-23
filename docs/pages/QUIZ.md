# QUIZ

**URL:** `/my/<org-slug>/courses/<course_id>/units/<unit_id>/quizzes/<quiz_id>`  
**Edit:** `/my/<org-slug>/courses/<course_id>/units/<unit_id>/quizzes/<quiz_id>/edit`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors and admins who teach the course. Parents (and a student login) when the course and the quiz are published and their student is enrolled.

## Purpose

Open one course quiz to print it, take it while it is accepting entries, or review entries. A page quiz block stays on the lesson page; this screen is the quiz families turn in.

## Behavior

- Load one quiz on this unit. A missing quiz, a quiz on another course, or a family opening an unpublished quiz shows not found.
- **Unpublished:** staff see an amber banner and **Publish**. Families do not see the quiz on the unit.
- **Published:** green **Published** badge for staff. **Unpublish** sits at the bottom.
- **Print** is always available to someone who can open the quiz. It opens [PRINT](./PRINT.md).
- Neither start nor end is set: families see print and download copy only. There is no **Submit**.
- A start, an end, or both: **Submit** only while now is inside the bounds that are set. Before the start, the form says when it opens. At or after the end, it says entries are closed. The database rejects a late or early submit.
- A parent with more than one enrolled child picks the student first. One student shows that student’s name.
- **Allow more than one attempt** off: one submitted entry per student. On: more entries until the window closes.
- Nothing is stored until **Submit**. There is no draft.
- **Grade questions automatically and show the score right away** on: the submitter sees a score like **8 of 10** immediately. Off: the entry is saved with no score. Later edits to the key do not change a saved score.
- Question kinds: **multiple choice**, **short answer**, **number**, **matching**, and **long answer**. Number and matching score with multiple choice. Short answer and long answer are stored for the teacher. A long answer asks how many blank lines to give (1–20). Matching mixes the right column the same way on screen and on paper.
- The score a family sees is the latest entry for that student.
- A parent entry is labeled **"<Parent name> on behalf of <child name>"**. A student login is labeled with the student name only.
- **Teacher view** always shows the answer key and every entry, including answers. **Share answer key with parents** (default off) lets a parent see the key whenever the quiz is published, including while the window is open and after it ends. A student login never sees the key. Staff **Student view** follows the parent rule.
- **Remove quiz** soft-deletes it after confirm.

## Data shown

- Title, description, **Quiz** badge, published or unpublished badge (staff)
- Accepting window, when one is set
- Questions, choices, and matching columns (correct choices and matching letters only when the answer key may show)
- Latest family entry, or every entry for the teacher (who submitted, when, score when one was stored, and the answers)
- Answer key when this person may see it

## Contents

- Header with **Back**, title, **Print**, and **Edit** (staff who can manage the course)
- Publish banner when unpublished
- Take form, or print-only copy
- Entries
- Answer key
- Unpublish and remove (staff)

## Primary actions

- Print
- Edit (staff)
- Publish / Unpublish
- Submit (family, while the window is open)
- Remove quiz

## Links to

- [UNIT](./UNIT.md) — back
- [COURSE](./COURSE.md) — when the quiz has no unit to return to
- [PRINT](./PRINT.md) — **Print**
- Via org chrome (instructor/admin): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [FEEDBACK](./FEEDBACK.md)
- Parent return: [ORG_HOME](./ORG_HOME.md)

## Notes

[FEATURES.md](../FEATURES.md) — course quiz, separate from a page quiz block. Not a material submission. No Activity notification and no gradebook in this slice.
