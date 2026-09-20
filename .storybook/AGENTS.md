# AGENTS — `.storybook/`

Storybook for Course Wright UI primitives ([docs/STACK.md](../docs/STACK.md)).

## Scope

- Vite builder (`@storybook/react-vite`)
- Stories live next to primitives in `src/ui/*.stories.tsx`
- Preview loads `src/styles/index.css` and brand fonts

## Rules

- Match [STYLE_GUIDE.md](../docs/STYLE_GUIDE.md) tokens.
- Do not invent product screens here — chrome and domain pages stay in `src/`.
- Keep addons light; this is for isolated UI, not a second docs site.

## Don’t

- Dump example Button/Header/Page stories under `src/stories/`.
- Import Storybook/Vitest plugins into the app `vite.config.ts`.
