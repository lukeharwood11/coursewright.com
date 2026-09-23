# AGENTS — `src/events/`

Shared **events** on the calendar: one **course**, several **classes**, or the whole **organization** (no course or class). Required **location**. Optional start/end times. A write-up page (Lexical blocks) plus links to existing course materials — not a `materials` row.

## Scope

- Create / view / edit / soft-delete (`event/`, `event-edit/`)
- Add from the calendar (staff Teacher view), a course, or a class
- Show on month/week/day and This week when the event applies to that person

## Rules

- Audience is one course, one or more classes, or the organization (nothing attached).
- Owners and admins can target any course or class in the org. An instructor can target a course they manage. Any org staff member can target classes or make an organization event.
- Students and staff **Student view** can open an event they can see. They cannot add or edit.
- One shared record. Editing it updates every course or class it is on.
- Month and week show a title chip. Day view shows **start and end time** and **location**. No hourly grid. No repeat.
- Print the write-up from the event page.

## Don’t

- Store the write-up as a course material.
- Put an event on more than one course, or mix a course with classes.
- Send email or Activity for an event in this slice.
