# RESOURCE_FOLDER

**URL:** `/my/<org-slug>/resources/folders/<folder_id>` (`?type=document|file|link`)  
**URL map:** [URLS.md](../URLS.md)

## Audience

Same as [RESOURCES](./RESOURCES.md), limited by this folder’s ACL (and inherited parent-folder ACL).

## Purpose

Browse one folder: child folders and items. Nested folders allowed. Same folder view as the library root.

## Behavior

Same screen as [RESOURCES](./RESOURCES.md) scoped to this folder.

- Path bar: Resources / ancestor folders (links) / this folder (plain text).
- Click a folder **icon** to expand its contents in place. Click a name to open that folder or item.
- Editors who can edit this folder: **+ New** (Folder / Document / Link / Upload files); right-click the pane to create; bulk upload into this folder. Staff: **Manage access** (gear) on the right of the title — who can view, plus specific people who can view or edit. **⋯** beside it: **Rename** and **Move** (outline folder picker).
- Checkboxes and **Select all** match [RESOURCES](./RESOURCES.md).
- Right-click a folder or item, or use its **⋯** beside the name (editors): **Open**, **Rename** (inline), **Move**, **Manage access** (staff; gear icon), **Publish** or **Unpublish** (items), **Print** (not links), **Download** (files), **Remove**. Remove hides it (soft-archive) after confirm.
- Drop files here to upload into this folder.
- Unpublished items are editors-only. Parents see published items their ACL allows. Parents get the path, title, filter, and list — no create toolbar and no editor menus.

Empty: same as root, scoped to the folder.

Not found: no access or missing folder → back to Resources.

## Data shown

- Folder **name**
- Path bar
- Child folders and items (title, kind icon, unpublished)
- On wider screens: creator, created date, and updated date when it changed

## Contents

- Path bar
- Title + **Manage access** (staff; gear) + folder **⋯** (editors: Rename / Move)
- Type filter and **+ New**
- Selection bar when rows are checked
- Dropzone + folder pane

## Primary actions

- Open child folder or item
- New folder / document / link
- Upload files
- Rename, move, access, publish, print, download, remove from the row menu
- Manage access (gear) and Rename / Move (**⋯**) for this folder
- Select rows to publish, print, download, move, or remove

## Links to

- [RESOURCES](./RESOURCES.md) — root / path bar
- [RESOURCE](./RESOURCE.md)
- [PRINT](./PRINT.md)
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [FEEDBACK](./FEEDBACK.md)
- Via student chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [RESOURCES](./RESOURCES.md), [ACTIVITY](./ACTIVITY.md)

## Notes

ACL inherit walks to the nearest folder with custom access. Folders are not published; items are.
