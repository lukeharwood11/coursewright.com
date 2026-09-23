# RESOURCE

**URL (view):** `/my/<org-slug>/resources/items/<item_id>`  
**URL (edit):** `/my/<org-slug>/resources/items/<item_id>/edit`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Anyone who can view the item (staff; parents/members per publish + ACL; write-grant editors). Edit is editors only.

## Purpose

Open one org resource: a **document** (Lexical page), **link**, or **file**.

## Behavior

### View

- Document: read-only Lexical page (same chrome as course page materials).
- Link: title + URL.
- File: in-app preview/download via org File (same players as file materials).
- Editors: **Edit** and **Print** (document and file) in the header on wide screens; on smaller screens they live under the header **⋯** menu with **Move** and **Manage access** (staff: inherit folder access, or Parents and Students tabs with a summary of both; gear icon). **Publish** / **Unpublish** and **Remove** (archive) stay on the page body.
- Unpublished: editors only. Families/parents do not see it until published.

### Edit

- Name (all types — file **resource title**, not the Storage blob name).
- Description.
- Link URL when type is link.
- **Save** / **Cancel** (reads **Close** when unchanged) in the header; on desktop also **Save & close** (primary; saves then returns to the resource view).
- Document: Lexical editor for the body.
- Cancel with unsaved changes confirms.

Not found: back to Resources.

## Data shown

- Title, type badge, published/unpublished
- Description when set
- Document body / link URL / file preview

## Contents

- Detail header (back to folder, actions)
- Visibility banner when unpublished
- Body by type
- Unpublish at the bottom when published (editors)

## Primary actions

- Print
- Edit / Save / (desktop) Save & close; Cancel reads Close when unchanged
- Move / Manage access (staff) under header **⋯**
- Publish / Unpublish
- Remove

## Links to

- [RESOURCE_FOLDER](./RESOURCE_FOLDER.md) or [RESOURCES](./RESOURCES.md) — back
- [PRINT](./PRINT.md) — `/my/<org-slug>/resources/items/<item_id>/print`
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [FEEDBACK](./FEEDBACK.md)
- Via student chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [RESOURCES](./RESOURCES.md), [ACTIVITY](./ACTIVITY.md)

## Notes

Not a course **material**. Resource **link** (this type) is an external URL, not a **Resource link** share URL to a material.
