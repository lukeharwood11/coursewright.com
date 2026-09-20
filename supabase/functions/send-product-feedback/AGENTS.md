# AGENTS — `send-product-feedback`

Email a stored `feedback` row to `hi@coursewright.com` via Resend.

## Rules

- API key stays in Edge Function secrets (`RESEND_API_KEY`, **HN-015**). Never the SPA.
- Rows are created with PostgREST + RLS. This Function only **sends** mail.
- Only the author of that row may trigger the send.
