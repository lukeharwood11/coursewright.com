# ORG_ROSTER

**URL:** `/my/<org-slug>/students`  
**Also:** `/my/<org-slug>/students?tab=classes`  
**Redirect:** `/my/<org-slug>/roster` → this page  
**URL map:** [URLS.md](../URLS.md)

## Audience

Teachers, parents, admins, and owners. Learners (student accounts and staff **Student view**) are sent to [PROGRESS](./PROGRESS.md).

## Purpose

Shared people entry for the organization. Names and classes live here. Grades live on the student and in the course gradebook. A class is not a grade container.


## Behavior

- Chrome label is **Students**. There is no top-level **Roster** or **Records** item.
- **Students** tab (default): searchable list of names. Each row shows class names, or “No classes yet”.
- **Class** filter narrows that list. It does not change who is enrolled in a course.
- **Classes** tab (`?tab=classes`): list of classes. Opening one goes to the same [CLASS](./CLASS.md) page as a class link on the student.
- **Tier 1 — View** (parents): linked students only. They can open a student and a class. They do not multi-select, add, or remove.
- **Tier 2 — View+Actions** (teachers, admins, owners): all students the staff list already returns. Multi-select → **Add to class** or **Enroll in course** (existing roster bulk-assign). **Select all matching** uses the current search and class filter.
- **Add students** and **Create class** are Tier 2.
- **Remove** is owners and admins only (confirm). A removed student also leaves classes and courses.
- Owners and admins see **Grading settings**, which opens [ORG_SETTINGS](./ORG_SETTINGS.md) on the Grading tab. Teachers do not edit the scale.
- Empty org is fine — create → print does not require a roster.

## Data shown

- Student list: **name**, **classes**, optional **grade**
- Class filter options
- Class tab: class **name**
- Batch add fields (Tier 2): name rows, optional student email, optional parent email / grade, paste names

## Contents

- Tabs: Students | Classes
- Students list + find filter + class filter
- Tier 2: selection bar, Add students, Create class
- Owners/admins: Remove, Grading settings link
- Open student → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- Open class → [CLASS](./CLASS.md)

## Primary actions

- Find a student
- Filter by class
- Open a student
- Open a class
- Tier 2: select students → add to class / enroll in course; add students; create a class
- Owners/admins: remove a student; open grading settings

## Links to

- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open student
- [CLASS](./CLASS.md) — open class
- [PROGRESS](./PROGRESS.md) — learner redirect
- [ORG_SETTINGS](./ORG_SETTINGS.md) — Grading settings (owners/admins)
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enrollments also live on the course
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Roster management and Progress — grading. Parent invite send stays on the student page. Families directory UI is not currently exposed in the SPA.
