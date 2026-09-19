# AGENTS — `src/parent/`

Parent dashboard: usability anchor. This week + important now + available **bulletins**.

## Scope

- Parent home: week range (Sun–Sat), **From your teachers** (available bulletins), **Important now**, **Coming up** (Assigned next + Due next), student tags, per-student this-week course cards (empty courses omitted)
- **Print this week** for **active** students (one student at a time in the PDF) + Print per material (compose `print/`)
- Simpler than instructor UI — always
- `model/` + `databridge/` for this-week data; org home (`organizations/org-home`) renders the parent view (including staff **Parent view**)
- Bulletin rows come from `bulletins/` databridge; availability lives in `bulletins/model/`

## Rules

- Tech-averse parent must understand the screen **immediately**.
- Label **Assigned** vs **Due** dates — never show a bare date without saying which kind it is.
- This week includes materials assigned in the week **and/or** due in the week.
- Phone-first; bottom tabs: This week | Progress (Progress dim until P1).
- Plain language — no LMS jargon ([STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md)).

## Don’t

- Crowd the home with instructor/builder complexity.
- Make print hard to find.
- Implement P1 progress here beyond a disabled tab unless FEATURES says so.
