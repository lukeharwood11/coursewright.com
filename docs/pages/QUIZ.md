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
- **Back** goes to the [COURSE](./COURSE.md) unless this quiz was opened from the [UNIT](./UNIT.md) page (same location-state pattern as materials), in which case it returns to that unit.
- **Unpublished:** staff see an amber banner and **Publish**. Families do not see the quiz on the unit.
- **Published:** green **Published** badge for staff. **Unpublish** sits at the bottom.
- **Print** is always available to someone who can open the quiz. It opens [PRINT](./PRINT.md).
- **Accept entries** off: families see print and download copy only. There is no **Submit**.
- **Accept entries** on with no start or end: **Submit** whenever the quiz is published.
- **Accept entries** on with a start, an end, or both: **Submit** only while now is inside the bounds that are set. Before the start, the form says when it opens. At or after the end, it says entries are closed. The database rejects a late or early submit. On the edit page, turning Accept entries on reveals the start/end fields. Picking a start date defaults the time to midnight; picking an until date defaults the time to 11:59 PM. A time already set stays when the date changes.
- A parent with more than one enrolled child picks the student first. One student shows that student’s name.
- **Allow more than one attempt** off: one submitted entry per student. On: more entries until the window closes (or while Accept entries stays on with no end).
- Nothing is stored until **Submit**. There is no draft.
- **Show results immediately** on: the submitter sees a score like **Score 4.5/5 (90%)** when every question received points. Off: the entry is saved with no score. Later edits to the key do not change a saved score.
- Each question has possible points, default **1**. The edit page puts questions first; settings and total possible points sit in a right side panel on desktop (above the questions on smaller screens). Fractions such as **4.5** are allowed. The title is in the edit header and saves when the field loses focus, on **Enter**, or when leaving the editor (back / Close / Cancel). Header actions match resource edit: quiet **Add description** / **Edit description**, **Save** / desktop **Save & close** / **Cancel** (reads **Close** when unchanged); below `md` those collapse into a **⋯** menu. Description is saved with the form. **Cmd/Ctrl+S** saves the rest of the form.
- Question kinds: **multiple choice**, **short answer**, **number**, **matching**, and **long answer**. A correct number earns the full points. Multiple choice splits points across the correct choices and subtracts a share for each wrong choice. Matching gives an equal share for each correct pair and does not subtract for a wrong pair. Short answer and long answer wait for the teacher. A long answer asks how many blank lines to give (1–20). Matching mixes the right column; on screen families pick the matching **text** (print still uses letters A/B/C for the blank worksheet).
- The score a family sees is the latest entry for that student.
- After submit (and when returning to the page), the take form is filled with that student’s latest answers and greyed out when they cannot submit again. Each question shows the points earned, such as **2 / 4**, or **Yet to be graded**. Autograde fills a first pass for multiple choice, number, and matching. Families see the numeric score on the outline and entry only when every question has points; until then a submitted entry shows submitted, not the score.
- Staff see submissions in three groups: **Needs grading**, **Autograded** (not verified), and **Graded**. **Grade next** opens one submission. Each question’s points box starts with the autograded amount when there is one. The teacher can type a different amount, up to the points possible. **Save and next** stores that as the teacher’s grade and opens the next waiting submission. The autograded amount stays visible so the teacher’s grade is a separate override.
- A parent entry is labeled **"<Parent name> on behalf of <child name>"**. A student login is labeled with the student name only.
- **Teacher view** always shows the answer key and every entry, including answers. **Share answer key with parents** (default off) lets a parent see the key whenever the quiz is published, including while the window is open and after it ends. A student login never sees the key. Staff **Student view** follows the parent rule.
- **Remove quiz** soft-deletes it after confirm.

## Data shown

- Title, description, **Quiz** badge, published or unpublished badge (staff)
- Accepting window, when one is set
- Questions, choices, and matching columns (correct choices and matching letters only when the answer key may show)
- Latest family entry summary (who, when, score when every question has points). Answers and points are in the take form above
- For staff: counts of submissions that need grading, are autograded, and are graded; one submission at a time while grading, with the student’s answer, the autograded points, and a points box
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
- Grade next / Save and next (staff)
- Remove quiz

## Links to

- [COURSE](./COURSE.md) — back (default, including when opened from the course outline)
- [UNIT](./UNIT.md) — back when opened from the unit page
- [PRINT](./PRINT.md) — **Print**
- Via org chrome (instructor/admin): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [FEEDBACK](./FEEDBACK.md)
- Parent return: [ORG_HOME](./ORG_HOME.md)

## Notes

[FEATURES.md](../FEATURES.md) — course quiz, separate from a page quiz block. Not a material submission. No Activity notification and no gradebook in this slice.
