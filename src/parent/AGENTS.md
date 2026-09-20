# AGENTS — `src/parent/`

Parent dashboard: usability anchor. This week’s **calendar** plus a **Focus** rail, with current **announcements** above.

## Scope

- Parent home: greeting, week range (Sun–Sat), student tags, **Announcements** (current one-way notices; unread notification until opened), **week cards** (`calendar/` `WeekCalendar` with `layout="cards"` — empty days omitted, cards wrap), **Focus** (Important now + Coming up: Assigned next / Due next), **Print this week**
- Week notes from published lesson plans sit as course-colored bars above the days. Day cards show plan text, then materials after a divider (assigned = outline, due = filled).
- Student tags filter the calendar, Focus, and announcements. One student skips the tags. Class/student announcements can still show without a course enrollment.
- **Print this week** for **active** students (one student at a time in the PDF): published lesson plans first (week note + day notes), then important now + dated materials.
- `model/` + `databridge/` for this-week data; org home (`organizations/org-home`) renders the parent view (including staff **Parent view**)
- Lesson plans come from `lesson-plans/` databridge (published only in this loader). Calendar widgets live in `calendar/`.
- Announcement rows come from `announcements/` databridge; availability and read state live in `announcements/model/`.

## Rules

- Tech-averse parent must understand the screen **immediately**.
- Label **Assigned** vs **Due** — never show a bare date without saying which kind it is.
- This week includes materials assigned in the week **and/or** due in the week, plus published lesson plans. Print stays the full week.
- Phone-first; bottom tabs: This week | Progress (Progress dim until P1). Sidebar also has Calendar, Announcements, and **Discussions** (**P1**) — discussions are **not** cards on this home.
- Plain language — no LMS jargon ([STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md)).

## Don’t

- Crowd the home with instructor/builder complexity.
- Make print hard to find.
- Implement P1 progress here beyond a disabled tab unless FEATURES says so.
- Bring back bulletins or a due-only list / “From your teachers” rail.
