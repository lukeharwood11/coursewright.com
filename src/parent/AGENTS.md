# AGENTS — `src/parent/`

Parent dashboard: usability anchor. This week + important now.

## Scope

- Parent home: week range (Sun–Sat), **Up next**, important now, student tags, per-student materials
- **Print this week** for **active** students + Print per material (compose `print/`)
- Simpler than instructor UI — always
- `model/` + `databridge/` for this-week data; org home (`organizations/org-home`) renders the parent view

## Rules

- Tech-averse parent must understand the screen **immediately**.
- Phone-first; bottom tabs: This week | Progress (Progress dim until P1).
- Plain language — no LMS jargon ([STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md)).

## Don’t

- Crowd the home with instructor/builder complexity.
- Make print hard to find.
- Implement P1 progress here beyond a disabled tab unless FEATURES says so.
