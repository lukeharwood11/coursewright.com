# AGENTS — `src/organizations/user-card/`

Reusable **user card**: avatar + name, links to the org [person profile](../user-profile/) (`org_profiles`). Prefer `orgProfileId`; `userId` still works and the profile page redirects. Use this anywhere a person is listed (discussion members, instructors, class leads, collaborators). Pass `fit` when the card should size to the person instead of stretching the row.
