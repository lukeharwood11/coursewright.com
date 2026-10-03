# AGENTS — `src/tours/`

Product tours (react-joyride). One provider, three keyed tours.

## Scope

- Step copy, order, and who qualifies live in `model/`.
- Load and upsert live in `databridge/productTours.ts`.
- `hooks/useProductTour.ts` owns the controlled step index, route changes, and session resume.
- `components/` only render Joyride.

## Rules

- `product_tour_progress` is the seen record. No localStorage source of truth. No per-tour migration.
- Upsert only when a tour finishes or is skipped (close counts as skipped). Do not write on step changes.
- Later hides that tour for this browser session only (`cw-product-tour-later:`). It does not upsert. Do not treat it as a seen row. Close stays skipped.
- In-progress `stepIndex` may sit in sessionStorage. That is ephemeral.
- Tour keys and `data-tour` anchors are constants. A redesigned tour bumps the key suffix (`-v2`).
- One tour at a time, in `TOUR_ORDER`. Do not spotlight a stand-in when a target is gone.
- Do not apply the migration from the app.

## Don’t

- Mount Joyride inside a page view.
- Target button copy. Target `[data-tour="…"]`.
- Add another tour library.
