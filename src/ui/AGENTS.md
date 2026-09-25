# AGENTS — `src/ui/`

Design-system primitives from [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md).

## Scope

- Button, ButtonLink, Input, Select, Wordmark, Badge, PublishedBadge, Avatar, PageFormActions (optional desktop **Save & close**; optional **Close** when unchanged), ConfirmDialog, DescriptionDialog (Add / Edit description on editor headers), InfoHint, **ListCardLink** (shared feed-row card chrome for announcements / discussions), **PageLoading** (animated mark + optional label), **TabList** / **Tab** / **SegmentGroup** / **SegmentButton** (segmented control — same pattern as Resources All / Documents / Files / Links)
- **DetailPageHeader** — shared detail-screen chrome (surface bar, compact title + inline back, meta, actions)
- `AnchoredPopup` — viewport-aware menus / tooltips (flip and stay in frame)
- `InfoHint` — information-circle button + anchored tooltip (lesson plans, class leads, …)
- `toastNotImplemented` / `toastSomethingWentWrong` / `toastCheckNetworkConnection` / `toastCaughtError` / `caughtErrorMessage` (sonner); `isNetworkError`; `useToastOnError` for load/mutation failures instead of page error copy (network failures toast “Check your network connection…”)
- `useSaveShortcut` — Cmd/Ctrl+S on an editor page (blocks the browser save dialog)
- Storybook stories colocated as `*.stories.tsx`
- No product flows

## Rules

- Wright Green primary; amber sparingly; Manrope for UI; Lora for wordmark/headings only.
- Sentence case; badges for status.
- Icons: **Heroicons** (`@heroicons/react`) — default 24 outline; see [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md). License notice: [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
- Print-related chrome still uses these tokens; print **page** rules live in `print/`.
- Prefer **DetailPageHeader** on detail screens (course, unit, material, announcement, discussion, roster student/class, …) instead of one-off title + “Back to…” link stacks.

## Don’t

- Use `window.alert`, `window.confirm`, or `window.prompt` — use **ConfirmDialog** (and toasts for one-way messages).
- Put course builder screens here.
- Invent purple / terracotta / Inter looks.
- Use Lora in buttons or form labels.
- Add a second icon library alongside Heroicons.
