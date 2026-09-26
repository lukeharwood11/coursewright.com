# USER_PROFILE

**URL:** `/my/<org-slug>/people/<org_profile_id>`  
**Also:** `/my/<org-slug>/people/<user_id>` — auth UUID still works; it redirects to the org profile id.  
**URL map:** [URLS.md](../URLS.md)

This page is always the in-org person (`org_profiles`), never Account settings / Supabase `profiles`. `<org_profile_id>` is the `org_profiles` row. `<user_id>` is only a legacy lookup. Distinct from [STUDENT_PROFILE](./STUDENT_PROFILE.md) (student records, including those with no login).

## Audience

Anyone with an active membership in this organization (staff and students). Owners and admins edit name and contact email. Staff (including observers) may edit their own org name.

## Purpose

Org-visible directory page for a person: who they are here, what they teach or lead, and which courses they are on through linked students. Organizers also update that person’s **name** and **contact email** here — not on [ORG_SETTINGS](./ORG_SETTINGS.md) Collaborators.

## Behavior

- Requires a signed-in org member. People outside the org cannot open the profile (RPC + RLS).
- Shows **name** and **role in this organization**. Email is hidden from the public directory. Owners and admins see **contact email** in the profile form. Staff editing themselves see their contact email read-only.
- **Teaches** lists active courses they are assigned to. Students only see **published** courses.
- **Leads** lists classes they are assigned as class leads.
- **Courses** lists active courses their linked students are enrolled in (published for students).
- Opening a course goes to [COURSE](./COURSE.md). Opening a class (staff) goes to [CLASS](./CLASS.md). Students see class names without a staff-only link.
- Unclaimed people show **Not claimed yet** and no course/class lists. Send the invite from [ORG_SETTINGS](./ORG_SETTINGS.md) Collaborators.
- Missing person or no membership in this org: plain-language not found.
- Reached from user cards (discussion members, teachers, collaborators, class leads), pending collaborator rows, and from discussion author profile circles / names (modal on the thread; full page elsewhere). The modal does not include the edit form.

## Data shown

- Display **name** (`org_profiles.name`)
- Org **role** (owner / admin / instructor / observer / parent) when claimed
- **Contact email** (`org_profiles.email`) for owners and admins, and for staff editing themselves
- Taught **courses** (title)
- Led **classes** (title)
- Family **courses** via parent–student links + enrollments

## Contents

- Avatar + name + role badge (or not-claimed note)
- Profile form when the viewer can edit: **Name** (required); **Contact email** for owners and admins
- Teaches list
- Leads list
- Courses list

## Primary actions

- Save name (owners, admins, and staff editing themselves)
- Save contact email (owners and admins)
- Open a course they teach or are on
- Open a class they lead (staff)

## Links to

- [COURSE](./COURSE.md) — taught / enrolled courses
- [CLASS](./CLASS.md) — class leads (staff)
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — own account name is edited there; org name is edited here
- [ORG_SETTINGS](./ORG_SETTINGS.md) — collaborators (add people, roles, send invite)
- [ORG_HOME](./ORG_HOME.md) — back when the person isn’t found
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Account settings edits `profiles.name`. This page edits the in-org `org_profiles` name and contact email. Student records stay on [STUDENT_PROFILE](./STUDENT_PROFILE.md).
