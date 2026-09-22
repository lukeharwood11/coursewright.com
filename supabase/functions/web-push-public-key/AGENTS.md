# AGENTS — `web-push-public-key`

Return the VAPID public key so an installed PWA can subscribe. Signed-in users only.

## Rules

- `verify_jwt = true`. No private key in the response.
- Keys are Edge Function secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, **HN-018**). If they are missing, respond 503 so the app hides the prompt.
