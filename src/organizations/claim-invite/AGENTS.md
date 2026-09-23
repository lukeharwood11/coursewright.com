# AGENTS — `src/organizations/claim-invite/`

Accept a staff or parent invite from `/invite/<token>`.

## Scope

- Claim page UI + hook. Unsigned visitors see the invited email and **Create account** / **Sign in**
- Same email as the invite; sending mail is `send-organization-invite`, not this screen
- Role is payload (`parent`, `student`, or owner/admin/instructor)

## Don’t

- Send email from this screen
- Grant course access from a parent invite alone — enrollment still gates materials
