# AGENTS — `src/events/`

Shared **events** on the calendar: one record for several **courses** or several **classes** (not both). Required **location**. Optional start/end times. A write-up page (Lexical blocks) plus links to existing course materials — not a `materials` row.

## Scope

- Create / view / edit / soft-delete (`event/`, `event-edit/`)
- Add from the calendar (staff Teacher view), a course, or a class
- Show on month/week/day and This week when the event applies to that person

## Rules

- Audience kind is course or class; pick **one or more** targets of that kind.
- Owners and admins can target any course or class in the org. Instructors must be able to manage **every** selected course. Any org staff member can target classes.
- Parents and staff **Parent view** can open an event they can see. They cannot add or edit.
- One shared record. Editing it updates every course or class it is on.
- Month and week show a title chip. Day view shows **start and end time** and **location**. No hourly grid. No repeat.
- Print the write-up from the event page.

## Don’t

- Store the write-up as a course material.
- Mix courses and classes on one event.
- Send email or Activity for an event in this slice.
