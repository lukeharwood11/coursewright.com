# Pages

Outlines for each UI screen. **Must stay in sync with** [URLS.md](../URLS.md) — see [docs/AGENTS.md](../AGENTS.md#urlsmd-and-pages-must-match).

Behavior source of truth: [FEATURES.md](../FEATURES.md).

| Page | URL |
|------|-----|
| [HOME](./HOME.md) | `/` |
| [ABOUT](./ABOUT.md) | `/about` |
| [PRICING](./PRICING.md) | `/pricing` |
| [CONTACT](./CONTACT.md) | `/contact` |
| [PRIVACY](./PRIVACY.md) | `/privacy` |
| [TERMS](./TERMS.md) | `/terms` |
| [COOKIES](./COOKIES.md) | `/cookies` |
| [DOCS](./DOCS.md) | `/docs` (topics under `/docs/<slug>`) |
| [CONSTRUCTION](./CONSTRUCTION.md) | Shared placeholder for `ready: false` footer links (none currently) |
| [LOGIN](./LOGIN.md) | `/login` |
| [SIGNUP](./SIGNUP.md) | `/signup` |
| [INVITE_CLAIM](./INVITE_CLAIM.md) | `/invite/<token>` |
| [ORG_PICKER](./ORG_PICKER.md) | `/my` |
| [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) | `/my/settings` |
| [FEEDBACK](./FEEDBACK.md) | `/my/feedback` · `/my/<org-slug>/feedback` |
| [ORG_HOME](./ORG_HOME.md) | `/my/<org-slug>` |
| [CALENDAR](./CALENDAR.md) | `/my/<org-slug>/calendar` |
| [EVENT](./EVENT.md) | `/my/<org-slug>/events/<event_id>` (new `…/events/new`; edit `…/edit`; print `…/print`) |
| [USER_PROFILE](./USER_PROFILE.md) | `/my/<org-slug>/people/<user_id>` |
| [ACTIVITY](./ACTIVITY.md) | `/my/<org-slug>/activity` | **P1** |
| [ORG_SETTINGS](./ORG_SETTINGS.md) | `/my/<org-slug>/settings` |
| [COURSE_LIST](./COURSE_LIST.md) | `/my/<org-slug>/courses` |
| [RESOURCES](./RESOURCES.md) | `/my/<org-slug>/resources` | **P1a** |
| [RESOURCE_FOLDER](./RESOURCE_FOLDER.md) | `/my/<org-slug>/resources/folders/<folder_id>` | **P1a** |
| [RESOURCE](./RESOURCE.md) | view `…/resources/items/<id>`; edit `…/edit` | **P1a** |
| [COURSE](./COURSE.md) | `/my/<org-slug>/courses/<course_id>` |
| [COURSE_ROSTER](./COURSE_ROSTER.md) | `/my/<org-slug>/courses/<course_id>/roster` |
| [COURSE_SETTINGS](./COURSE_SETTINGS.md) | `/my/<org-slug>/courses/<course_id>/settings` |
| [LESSON_PLAN](./LESSON_PLAN.md) | `/my/<org-slug>/courses/<course_id>/lesson-plans/<lesson_plan_id>` (new `…/lesson-plans/new`; edit `…/edit`) |
| [ANNOUNCEMENTS](./ANNOUNCEMENTS.md) | `/my/<org-slug>/announcements` |
| [ANNOUNCEMENT](./ANNOUNCEMENT.md) | `/my/<org-slug>/announcements/<announcement_id>` (new `…/announcements/new`; edit `…/edit`) |
| [DISCUSSIONS](./DISCUSSIONS.md) | `/my/<org-slug>/discussions` | **P1** |
| [DISCUSSION](./DISCUSSION.md) | `/my/<org-slug>/discussions/<discussion_id>` (new `…/discussions/new`) | **P1** |
| [TEMPLATE_LIST](./TEMPLATE_LIST.md) | `/my/<org-slug>/templates` | **P1** |
| [TEMPLATE](./TEMPLATE.md) | `/my/<org-slug>/templates/<template_id>` | **P1** |
| [TEMPLATE_SETTINGS](./TEMPLATE_SETTINGS.md) | `/my/<org-slug>/templates/<template_id>/settings` | **P1** |
| [UNIT](./UNIT.md) | `/my/<org-slug>/courses/…/units/<unit_id>` (template tree **P1**) |
| [MATERIAL](./MATERIAL.md) | view `…/materials/<id>`; edit `…/materials/<id>/edit` (top-level or under unit) |
| [QUIZ](./QUIZ.md) | `…/units/<unit_id>/quizzes/<quiz_id>`; edit appends `/edit` |
| [PRINT](./PRINT.md) | `…/materials/<id>/print`; `…/units/<id>/print`; `…/quizzes/<id>/print`; `/my/<org-slug>/print-this-week`; `…/resources/items/<id>/print`; `…/resources/print?items=` |
| [ORG_ROSTER](./ORG_ROSTER.md) | `/my/<org-slug>/roster` |
| [STUDENT_PROFILE](./STUDENT_PROFILE.md) | `/my/<org-slug>/roster/<student_id>` |
| [CLASS](./CLASS.md) | `/my/<org-slug>/classes/<class_id>` |
| [FAMILIES](./FAMILIES.md) | `/my/<org-slug>/families` | **Not currently routed** |
| [FAMILY](./FAMILY.md) | `/my/<org-slug>/families/<family_id>` | **Not currently routed** |

**No page file yet** (paths TBD in [URLS.md](../URLS.md)): resource share entry, search route. Share / search UX is still required on the locked pages above; print routes are locked — see [PRINT](./PRINT.md).

---

## P0 FEATURES → page coverage

Every P0 feature in [FEATURES.md](../FEATURES.md) maps to at least one locked page (or is chrome/TBD-route only).

| P0 feature | Primary page(s) |
|------------|-----------------|
| Organizations / create org / first owner | [ORG_PICKER](./ORG_PICKER.md) |
| Org permalink slug | [ORG_PICKER](./ORG_PICKER.md), [ORG_SETTINGS](./ORG_SETTINGS.md) |
| Admin invites / staff roles / last-admin guard | [ORG_SETTINGS](./ORG_SETTINGS.md), [INVITE_CLAIM](./INVITE_CLAIM.md), [ORG_PICKER](./ORG_PICKER.md) (pending requests) |
| Org grade scheme | [ORG_SETTINGS](./ORG_SETTINGS.md) |
| Authentication (email password / magic link + Google) | [LOGIN](./LOGIN.md), [SIGNUP](./SIGNUP.md) |
| Account / org-visible people | [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [USER_PROFILE](./USER_PROFILE.md) |
| RBAC (owner / admin / instructor / parent) | Role splits on [ORG_HOME](./ORG_HOME.md) + gated pages; staff **Student view** in org chrome |
| Student profiles | [ORG_ROSTER](./ORG_ROSTER.md), [STUDENT_PROFILE](./STUDENT_PROFILE.md), [COURSE_ROSTER](./COURSE_ROSTER.md), [CLASS](./CLASS.md) |
| Roster / enrollments / parent linkage & invites | [ORG_ROSTER](./ORG_ROSTER.md), [COURSE_ROSTER](./COURSE_ROSTER.md), [STUDENT_PROFILE](./STUDENT_PROFILE.md), [CLASS](./CLASS.md) |
| Families / parent directory | [FAMILIES](./FAMILIES.md), [FAMILY](./FAMILY.md) — feature kept; SPA UI not currently routed |
| Course builder — courses only; create from scratch or from another course | [COURSE_LIST](./COURSE_LIST.md), [COURSE](./COURSE.md), [COURSE_SETTINGS](./COURSE_SETTINGS.md) |
| Units + dating (optional); top-level materials allowed | [COURSE](./COURSE.md), [UNIT](./UNIT.md) |
| Rich materials — Add: page / link / file; pages use blocks | [MATERIAL](./MATERIAL.md) |
| Classes (student groups) | [ORG_ROSTER](./ORG_ROSTER.md) (list/create), [CLASS](./CLASS.md) |
| File / content versioning, soft deletes | [MATERIAL](./MATERIAL.md), [COURSE](./COURSE.md) |
| Homework = dated materials; Important now; **Lesson plans**; Calendar; **Announcements** | [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [MATERIAL](./MATERIAL.md), [LESSON_PLAN](./LESSON_PLAN.md), [ANNOUNCEMENT](./ANNOUNCEMENT.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [COURSE](./COURSE.md) |
| Student home / access rules | [ORG_HOME](./ORG_HOME.md); claim via [INVITE_CLAIM](./INVITE_CLAIM.md) / [LOGIN](./LOGIN.md) / [SIGNUP](./SIGNUP.md) |
| Print (material / unit / this week) | [PRINT](./PRINT.md); entry from [MATERIAL](./MATERIAL.md), [UNIT](./UNIT.md), [ORG_HOME](./ORG_HOME.md) |
| Resource links / share with students | [MATERIAL](./MATERIAL.md) (entry URL TBD) |
| Advanced search | Product chrome — [ORG_HOME](./ORG_HOME.md) + org chrome; route TBD |
| Marketing / trust | [HOME](./HOME.md), [ABOUT](./ABOUT.md), [PRICING](./PRICING.md), [CONTACT](./CONTACT.md), [PRIVACY](./PRIVACY.md), [TERMS](./TERMS.md), [COOKIES](./COOKIES.md), [DOCS](./DOCS.md) |

**Intentionally not on locked pages yet (FEATURES / URLS):**

| Concern | Status |
|---------|--------|
| Resource share entry URL | Path TBD — recipients land on [MATERIAL](./MATERIAL.md) after login |
| Forms content kind | FEATURES in design — P1b inside Resources; not on [MATERIAL](./MATERIAL.md) |
| Course templates + ACL / promote / sync | **P1** — [TEMPLATE_LIST](./TEMPLATE_LIST.md), [TEMPLATE](./TEMPLATE.md), [TEMPLATE_SETTINGS](./TEMPLATE_SETTINGS.md) |
| Course quiz (take in the app or print) | **P1** — [QUIZ](./QUIZ.md); print via [PRINT](./PRINT.md) |
| Parent summary layer / Progress tab | **P1** |
| Discussions | **P1** — [DISCUSSIONS](./DISCUSSIONS.md), [DISCUSSION](./DISCUSSION.md) |
| Resources | **P1a** — [RESOURCES](./RESOURCES.md), [RESOURCE_FOLDER](./RESOURCE_FOLDER.md), [RESOURCE](./RESOURCE.md); print via [PRINT](./PRINT.md) |
| Activity / notifications | **P1** — [ACTIVITY](./ACTIVITY.md) |
| Product feedback | **P1** — [FEEDBACK](./FEEDBACK.md) |
| Billing UI | **P1** (marketing on [PRICING](./PRICING.md); stub on [ORG_SETTINGS](./ORG_SETTINGS.md)) |
| Print whole course | Explicitly out of scope for initial release |
| Student accounts / cross-org families | **P2** |

**Open TBDs that match FEATURES opens** (do not invent): family display name / merge-split UX; account preference fields; marketing/legal copy; soft-delete/versioning chrome density; parent visibility of course list.
