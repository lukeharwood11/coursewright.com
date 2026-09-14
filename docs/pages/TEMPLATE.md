# TEMPLATE

**URL:** `/my/<org-slug>/templates/<template_id>`  
**URL map:** [URLS.md](../URLS.md)  
**Phase:** **P1** — not in P0 product UI

## Audience

Users with template **view**, **edit**, or **owner**. Org admins see all.

## Purpose

Template builder home — author units/materials for reuse. No roster.


## Behavior

- Template builder home (blueprint — no roster, no course start/end dates).
- Edit structure when edit/owner; view-only otherwise.
- Create course from template copies materials into a new linked course.
- Removing resources: deprecate (active courses untouched) vs delete (soft-delete template + unmodified course copies); overridden course copies left alone.
- Template edits sync to unmodified linked course copies of that resource only.

## Data shown

- Template **title**, **grade metadata**
- Ordered **units** and nested **materials** (titles, kinds, dates on units if any)
- Access summary / link to settings
- Sync / linkage indicators TBD

## Contents

- Template title / grade metadata summary
- Units list → [UNIT](./UNIT.md) (template URLs)
- Link to [TEMPLATE_SETTINGS](./TEMPLATE_SETTINGS.md) (ACL)
- **Create course from this template** (view+)
- Deprecate vs delete cues when removing resources (configurable; deprecate preferred default)
- Sync implications: edits flow to unmodified linked course copies only
- Versioning / revert for dangerous actions (TBD UX)

## Primary actions

- Edit structure / open materials (edit+)
- Create course
- Open settings / manage access (owner+)
- Print materials/units while authoring (same print bar as courses)

## Links to

- [UNIT](./UNIT.md) — open / add unit (template URLs)
- [MATERIAL](./MATERIAL.md) — open material
- [TEMPLATE_SETTINGS](./TEMPLATE_SETTINGS.md) — ACL / metadata
- [COURSE](./COURSE.md) — after create course from this template
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Template access, sync, promote, deprecate vs delete.
