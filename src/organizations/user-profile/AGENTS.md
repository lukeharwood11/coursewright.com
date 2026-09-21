# AGENTS — `src/organizations/user-profile/`

Org-scoped **user profile** for people with accounts. Visible to other members of the same organization. Shows name, role, courses they teach, classes they lead, and courses their linked students are in. Distinct from student profiles in `roster/`.

`UserProfilePage` is the routed screen; `UserProfileModal` shows the same content in a dialog (e.g. from discussion authors). Shared markup lives in `components/UserProfileContent.tsx`.
