# AGENTS — `src/feedback/`

Signed-in **Send feedback** form. Account menu → form. Name, email, and organization are filled from the session.

## Scope

- `/my/feedback` (account shell) and `/my/<org-slug>/feedback` (org shell)
- PostgREST insert into `feedback`; Edge Function `send-product-feedback` emails `hi@` (same `RESEND_API_KEY` as HN-015)
- Read-only identity fields; the person writes a message

## Don’t

- Put this on the public marketing contact page
- Invent extra channels (chat, phone)
