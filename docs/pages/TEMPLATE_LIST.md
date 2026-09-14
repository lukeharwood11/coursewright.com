# TEMPLATE_LIST

**URL:** `/my/<org-slug>/templates`  
**URL map:** [URLS.md](../URLS.md)  
**Phase:** **P1** — not in P0 product UI

## Audience

Instructors and admins. Visibility respects template ACL; **org admins see every template**.

## Purpose

Browse reusable **course templates** (blueprints — no roster, no course-level start/end dates).


## Behavior

- Lists templates visible to the user (ACL view/edit/owner); **org admins see all**.
- Create template; open template builder; create **course** from a template (requires view).
- No roster on templates.
- **P0 reuse:** create a course from another course on [COURSE_LIST](./COURSE_LIST.md) instead.

## Data shown

Per template row:

- Template **title**
- **Grade metadata** when set
- User’s access level (view / edit / owner) TBD
- Owner or updated-at TBD

## Contents

- List templates user can view (plus all for admins)
- Create template
- Create **course** from a template (requires **view**; instructor)
- Open → [TEMPLATE](./TEMPLATE.md)
- Grade metadata shown when set
- Empty state: create template, or promote a course later

## Primary actions

- Create template
- Create course from template → lands in [COURSE](./COURSE.md)
- Open template

## Links to

- [TEMPLATE](./TEMPLATE.md) — open template
- [COURSE](./COURSE.md) — after create course from template
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Templates vs courses (**templates = P1**), template access (owner / edit / view).
