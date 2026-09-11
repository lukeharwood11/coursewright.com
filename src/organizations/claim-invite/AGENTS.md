# AGENTS — `src/organizations/claim-invite/`

Accept a staff or parent invite from `/invite/<token>`.

## Scope

- Claim page UI + hook
- Same email as the invite; no email sending (v0)
- Role is payload (`parent` vs owner/admin/instructor)

## Don’t

- Send email from this screen
- Grant course access from a parent invite alone — enrollment still gates materials
