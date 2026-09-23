# RESOURCES

**URL:** `/my/<org-slug>/resources` (`?type=document|file|link`)  
**URL map:** [URLS.md](../URLS.md)

## Audience

Owners, admins, and instructors always (Teacher view). Students (and staff **Student view**; linked parents inherit) when they can see at least one resource.

## Purpose

Org-scoped **Resources** home: a folder view of top-level folders and unfiled items. Not course materials.

## Behavior

- List non-archived folders and items the actor can see (RLS: membership + folder/item ACL). At the library root, parents and students also see a shared item — and a folder they can open — when its parent folder is hidden from them. Opening that item goes back to Resources, because the staff-only folder stays closed. Staff still see the real folder tree.
- The screen is one folder at a time: folders first, then items. Click a folder **icon** to expand that folder in place (nested folders expand the same way). Click a name to open the folder or item.
- Path bar: **Resources** at the root. Type filter is a quiet control: All / Documents / Files / Links. Folders stay visible while a type filter is on.
- Editors (staff, or write-grant on this location): **+ New** at the top (same segment look as the type filter). Menu: **Folder**, then **Document**, **Link**, and **Upload files**.
- **New document** creates an unpublished item titled Untitled and opens the editor.
- **New link** asks for a title and web address.
- Right-click the empty pane (editors) for the same create actions. Drag-drop or the upload action adds files (titles from filenames; unpublished; progress panel).
- Opening a folder goes to [RESOURCE_FOLDER](./RESOURCE_FOLDER.md). Opening an item goes to [RESOURCE](./RESOURCE.md).
- Checkboxes select folders and items (including inside an expanded folder). **Select all** covers this view’s top-level rows. The selection bar offers **Publish**, **Unpublish**, **Print**, **Download**, **Move**, and **Remove** when they apply. **Move** opens an outline folder picker (expandable tree, plus top-level Resources). Print opens one packet. One file downloads on its own; several files download as a zip. Folders in the selection can move or be removed; publish, print, and download apply to selected items only.
- Right-click a folder or item, or use its **⋯** (editors): **Open**, **Rename**, **Move**, **Manage access** (staff; gear — Parents and Students tabs, with a summary of both), **Publish** or **Unpublish** (items), **Print** (not links), **Download** (files), **Remove**.
- Empty: explain the next step for editors (add a folder or drop files); for students, that nothing is shared here yet. A type filter with no matches says so.

## Data shown

- Page title **Resources**
- Path bar
- Folder names
- Item title, kind icon, unpublished badge
- On wider screens: who created it, created date, and updated date when it changed. Narrow screens keep the name.
- Upload queue (when files are in progress)

## Contents

- Path bar
- Title
- Type filter
- **+ New** (editors)
- Selection bar when rows are checked
- Folder pane (dropzone)

## Primary actions

- Open a folder or item
- New folder / document / link
- Upload files (picker, **+ New → Upload files**, or drop)
- Select rows to publish, print, download, move, or remove

## Links to

- [RESOURCE_FOLDER](./RESOURCE_FOLDER.md)
- [RESOURCE](./RESOURCE.md)
- [PRINT](./PRINT.md) — selected documents and files, or one item
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [FEEDBACK](./FEEDBACK.md)
- Via student chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [RESOURCES](./RESOURCES.md) (when visible), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Resources (**P1a**). Independent of enrollment. Forms are P1b.
