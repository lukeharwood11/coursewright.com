# AGENTS — `src/ui/`

Design-system primitives from [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md).

## Scope

- Button, ButtonLink, Input, Select, Wordmark, Badge, PublishedBadge, Avatar, PageFormActions, ConfirmDialog
- `AnchoredPopup` — viewport-aware menus / tooltips (flip and stay in frame)
- `toastNotImplemented` (sonner) for screens that are not built yet
- Storybook stories colocated as `*.stories.tsx`
- No product flows

## Rules

- Wright Green primary; amber sparingly; Manrope for UI; Lora for wordmark/headings only.
- Sentence case; badges for status.
- Icons: **Heroicons** (`@heroicons/react`) — default 24 outline; see [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md). License notice: [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
- Print-related chrome still uses these tokens; print **page** rules live in `print/`.

## Don’t

- Put course builder screens here.
- Invent purple / terracotta / Inter looks.
- Use Lora in buttons or form labels.
- Add a second icon library alongside Heroicons.
