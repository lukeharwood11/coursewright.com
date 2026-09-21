# USER_PROFILE

**URL:** `/my/<org-slug>/people/<user_id>`  
**URL map:** [URLS.md](../URLS.md)

`<user_id>` is the auth user UUID (`profiles.id`). Distinct from [STUDENT_PROFILE](./STUDENT_PROFILE.md) (org student records, no login).

## Audience

Anyone with an active membership in this organization (staff and families).

## Purpose

Org-visible directory page for a person with an account: who they are here, what they teach or lead, and which courses they are on through linked students.

## Behavior

- Requires a signed-in org member. People outside the org cannot open the profile (RPC + RLS).
- Shows **name** and **role in this organization**. Email is not shown here (staff still see email on [ORG_SETTINGS](./ORG_SETTINGS.md)).
- **Teaches** lists active courses they are assigned to. Families only see **published** courses.
- **Leads** lists classes they are assigned as class leads.
- **Courses** lists active courses their linked students are enrolled in (published for families).
- Opening a course goes to [COURSE](./COURSE.md). Opening a class (staff) goes to [CLASS](./CLASS.md). Families see class names without a staff-only link.
- Missing person or no membership in this org: plain-language not found.
- Reached from user cards (discussion members, teachers, collaborators, class leads) and from discussion author profile circles / names (modal on the thread; full page elsewhere).

## Data shown

- Display **name** (`profiles.name`)
- Org **role** (owner / admin / instructor / parent)
- Taught **courses** (title)
- Led **classes** (title)
- Family **courses** via parent–student links + enrollments

## Contents

- Avatar + name + role badge
- Teaches list
- Leads list
- Courses list

## Primary actions

- Open a course they teach or are on
- Open a class they lead (staff)

## Links to

- [COURSE](./COURSE.md) — taught / enrolled courses
- [CLASS](./CLASS.md) — class leads (staff)
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — own display name is edited there, not on this page
- [ORG_HOME](./ORG_HOME.md) — back when the person isn’t found
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Account settings remain the place to **edit** your own name. This page is a read-only org directory. Student records stay on [STUDENT_PROFILE](./STUDENT_PROFILE.md).
