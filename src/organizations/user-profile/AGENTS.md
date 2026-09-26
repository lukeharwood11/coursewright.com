# AGENTS — `src/organizations/user-profile/`

Org-scoped **person profile** (`org_profiles`). Visible to other members of the same organization. Shows name, role, courses they teach, classes they lead, and courses their linked students are in. Distinct from student records in `roster/` (those stay on the student profile page).

Owners and admins edit **name** and **contact email** here. Staff (including observers) may edit their own org name. Account `profiles.name` stays on Account settings.

`UserProfilePage` is the routed screen at `/people/<org_profile_id>` (UUID URLs redirect here). `UserProfileModal` shows the directory content in a dialog without the edit form; **View profile** opens the org profile page. Shared markup lives in `components/UserProfileContent.tsx`.
