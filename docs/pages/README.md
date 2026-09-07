# Pages

Outlines for each UI screen. **Must stay in sync with** [URLS.md](../URLS.md) — see [docs/AGENTS.md](../AGENTS.md#urlsmd-and-pages-must-match).

Behavior source of truth: [FEATURES.md](../FEATURES.md).

| Page | URL |
|------|-----|
| [HOME](./HOME.md) | `/` |
| [ABOUT](./ABOUT.md) | `/about` |
| [PRICING](./PRICING.md) | `/pricing` |
| [CONSTRUCTION](./CONSTRUCTION.md) | `/contact`, `/privacy`, `/terms`, `/cookies` |
| [PRIVACY](./PRIVACY.md) | `/privacy` (outline for real policy text — live screen is construction until then) |
| [LOGIN](./LOGIN.md) | `/login` |
| [SIGNUP](./SIGNUP.md) | `/signup` |
| [ORG_PICKER](./ORG_PICKER.md) | `/my` |
| [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) | `/my/settings` |
| [ORG_HOME](./ORG_HOME.md) | `/my/<org-slug>` |
| [ORG_SETTINGS](./ORG_SETTINGS.md) | `/my/<org-slug>/settings` |
| [COURSE_LIST](./COURSE_LIST.md) | `/my/<org-slug>/courses` |
| [COURSE](./COURSE.md) | `/my/<org-slug>/courses/<course_id>` |
| [COURSE_ROSTER](./COURSE_ROSTER.md) | `/my/<org-slug>/courses/<course_id>/roster` |
| [COURSE_SETTINGS](./COURSE_SETTINGS.md) | `/my/<org-slug>/courses/<course_id>/settings` |
| [TEMPLATE_LIST](./TEMPLATE_LIST.md) | `/my/<org-slug>/templates` | **P1** |
| [TEMPLATE](./TEMPLATE.md) | `/my/<org-slug>/templates/<template_id>` | **P1** |
| [TEMPLATE_SETTINGS](./TEMPLATE_SETTINGS.md) | `/my/<org-slug>/templates/<template_id>/settings` | **P1** |
| [UNIT](./UNIT.md) | `/my/<org-slug>/courses/…/units/<unit_id>` (template tree **P1**) |
| [MATERIAL](./MATERIAL.md) | view `…/materials/<id>`; edit `…/materials/<id>/edit` (top-level or under unit) |
| [PRINT](./PRINT.md) | `…/materials/<id>/print`; `…/units/<id>/print`; `/my/<org-slug>/print-this-week` |
| [ORG_ROSTER](./ORG_ROSTER.md) | `/my/<org-slug>/roster` |
| [STUDENT_PROFILE](./STUDENT_PROFILE.md) | `/my/<org-slug>/roster/<student_id>` |
| [FAMILIES](./FAMILIES.md) | `/my/<org-slug>/families` |
| [FAMILY](./FAMILY.md) | `/my/<org-slug>/families/<family_id>` |

**No page file yet** (paths TBD in [URLS.md](../URLS.md)): invite claim, resource share entry, search route. Share / search UX is still required on the locked pages above; print routes are locked — see [PRINT](./PRINT.md).

---

## P0 FEATURES → page coverage

Every P0 feature in [FEATURES.md](../FEATURES.md) maps to at least one locked page (or is chrome/TBD-route only).

| P0 feature | Primary page(s) |
|------------|-----------------|
| Organizations / create org / first owner | [ORG_PICKER](./ORG_PICKER.md) |
| Org permalink slug | [ORG_PICKER](./ORG_PICKER.md), [ORG_SETTINGS](./ORG_SETTINGS.md) |
| Admin invites / staff roles / last-admin guard | [ORG_SETTINGS](./ORG_SETTINGS.md) |
| Org grade scheme | [ORG_SETTINGS](./ORG_SETTINGS.md) |
| Authentication (email + Google) | [LOGIN](./LOGIN.md), [SIGNUP](./SIGNUP.md) |
| RBAC (owner / admin / instructor / parent) | Role splits on [ORG_HOME](./ORG_HOME.md) + gated pages |
| Student profiles | [ORG_ROSTER](./ORG_ROSTER.md), [STUDENT_PROFILE](./STUDENT_PROFILE.md), [COURSE_ROSTER](./COURSE_ROSTER.md) |
| Roster / enrollments / parent linkage & invites | [ORG_ROSTER](./ORG_ROSTER.md), [COURSE_ROSTER](./COURSE_ROSTER.md), [STUDENT_PROFILE](./STUDENT_PROFILE.md) |
| Families / parent directory | [FAMILIES](./FAMILIES.md), [FAMILY](./FAMILY.md) |
| Course builder — courses only; create from scratch or from another course | [COURSE_LIST](./COURSE_LIST.md), [COURSE](./COURSE.md), [COURSE_SETTINGS](./COURSE_SETTINGS.md) |
| Units + dating (optional); top-level materials allowed | [COURSE](./COURSE.md), [UNIT](./UNIT.md) |
| Rich materials — Add: page / link / file; pages use blocks | [MATERIAL](./MATERIAL.md) |
| Classes (student groups) | TBD page until URL locked — roster-adjacent |
| File / content versioning, soft deletes | [MATERIAL](./MATERIAL.md), [COURSE](./COURSE.md) |
| Homework = dated materials; Important now | [ORG_HOME](./ORG_HOME.md), [MATERIAL](./MATERIAL.md) |
| Parent dashboard / access rules | [ORG_HOME](./ORG_HOME.md); claim via [LOGIN](./LOGIN.md) / [SIGNUP](./SIGNUP.md) |
| Print (material / unit / this week) | [PRINT](./PRINT.md); entry from [MATERIAL](./MATERIAL.md), [UNIT](./UNIT.md), [ORG_HOME](./ORG_HOME.md) |
| Resource links / share with parents | [MATERIAL](./MATERIAL.md) (entry URL TBD) |
| Advanced search | Product chrome — [ORG_HOME](./ORG_HOME.md) + org chrome; route TBD |
| Marketing / trust | [HOME](./HOME.md), [ABOUT](./ABOUT.md), [PRICING](./PRICING.md), [CONSTRUCTION](./CONSTRUCTION.md) (footer legal/contact until copy exists; [PRIVACY](./PRIVACY.md) outline) |

**Intentionally not on locked pages yet (FEATURES / URLS):**

| Concern | Status |
|---------|--------|
| Invite claim URL | Path TBD — no page file until locked |
| Resource share entry URL | Path TBD — recipients land on [MATERIAL](./MATERIAL.md) after login |
| Class list / detail URLs | TBD — Class is P0 concept; no page file until path locked |
| Forms content kind | FEATURES in design — not P0 on [MATERIAL](./MATERIAL.md) |
| Course templates + ACL / promote / sync | **P1** — [TEMPLATE_LIST](./TEMPLATE_LIST.md), [TEMPLATE](./TEMPLATE.md), [TEMPLATE_SETTINGS](./TEMPLATE_SETTINGS.md) |
| Quiz online take + autograde | **P1** |
| Parent summary layer / Progress tab | **P1** |
| Billing UI | **P1** (marketing on [PRICING](./PRICING.md); stub on [ORG_SETTINGS](./ORG_SETTINGS.md)) |
| Print whole course | Explicitly out of scope for initial release |
| Student accounts / cross-org families | **P2** |

**Open TBDs that match FEATURES opens** (do not invent): family display name / merge-split UX; account preference fields; marketing/legal copy; soft-delete/versioning chrome density; parent visibility of course list.
