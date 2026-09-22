# AGENTS — `src/notifications/push/`

Installed-PWA device notifications for Activity. Browser tabs do not subscribe.

## Scope

- Org-shell prompt (`ActivityPushChrome`)
- Account settings control (`PushNotificationSetting`)
- `browser.ts` — PushManager subscribe / unsubscribe
- `hooks/` — permission, Vault-backed public key, re-save, tap navigation

## Rules

- Subscribe only when `isInstalledPwa` is true.
- Hide the prompt until the public key loads (missing VAPID secrets, **HN-018**).
- **Not now** hides the prompt on this device. Account settings can still turn notifications on.
- **Turn off** stays off on this device even though the browser permission remains granted.
- A push tap is handled by the service worker. This folder only listens for the fallback message.

## Don’t

- Insert `notifications` rows here.
- Prompt in a normal browser tab.
