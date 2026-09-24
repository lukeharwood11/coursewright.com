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
- Editors: **Edit** and **Print** (document and file) in the header on wide screens; on smaller screens they live under the header **⋯** menu with **Move** and **Manage access** (staff: inherit folder access, or Parents and Students tabs; small cards name each audience that can open it; gear icon). **Publish** / **Unpublish** and **Remove** (archive) stay on the page body.
- Unpublished: editors only. Families/parents do not see it until published.

### Edit

Word-like layout: compact header chrome; the document editor fills most of the page.

- No “Edit …” page title. One header row: back, editable **name** beside it, then a quiet **Add description** / **Edit description** (opens a small dialog), **Save** / **Cancel** (reads **Close** when unchanged); on desktop also **Save & close** (primary; saves then returns to the resource view). **Cmd/Ctrl+S** saves when there are changes. Below the `md` breakpoint those actions collapse into a header **⋯** menu.
- Name (all types — file **resource title**, not the Storage blob name). Leaving the name field, pressing **Enter**, or leaving the editor (back / Close / Cancel) saves it on its own.
- Description via the header button (not a always-visible field).
- Link URL when type is link (slim field under the header).
- Document: Lexical editor for the body (majority of the viewport).
- Cancel with unsaved changes confirms.

Not found: back to Resources.

## Data shown

- Title, type badge, published/unpublished
- Description when set
- Document body / link URL / file preview

## Contents

- View: detail header (back to folder, actions)
- Edit: compact header (back, name field, description button, save actions); document editor fills the page
- Visibility banner when unpublished (view)
- Body by type
- Unpublish at the bottom when published (editors, view)

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
