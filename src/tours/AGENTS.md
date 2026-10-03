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
- `first-course-v1` qualifies only when this organization has no course, unless this session already started it. Courses are org-scoped. Not qualifying writes no progress row and does not block the next tour.
- Hide Next when the step waits for the spotlighted click, submit, or the next target to appear, unless that step is last and the click is unavailable. Keep Next when an earlier card is only pointing something out. The last step of a tour says Done when it is a point-out and finishes the tour (not Skip). After the add-material step, later steps must not require a click. `preview-as-family` is that Done step and must not switch the user into Preview. Save organization is not last.

## Don’t

- Mount Joyride inside a page view.
- Target button copy. Target `[data-tour="…"]`.
- Add another tour library.
