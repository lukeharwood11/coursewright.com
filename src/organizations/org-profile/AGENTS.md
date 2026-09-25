# AGENTS — `src/organizations/org-profile/`

Read-only organization profile for all members at `/my/<org-slug>/profile`. Owners get **Edit organization** → org settings.

## Scope

- `OrgProfilePage` — routed screen
- `OrgProfileContent` — name, icon, permalink, type, school days, optional contact fields

## Don’t

- Put billing, collaborators, or grade scheme here — those stay on org settings.
