# REPORT_CARD

**URL:** `/my/<org-slug>/report-cards/<card_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff who can manage the course edit a draft and submit it. A linked parent or the student can open a **sent** card. Drafts stay with staff.

## Purpose

Review one course report card, edit the comment, and send it. Grades on the card are a snapshot refreshed from the gradebook, not a second score store.


## Behavior

- Pattern A starts from [STUDENT_PROFILE](./STUDENT_PROFILE.md) **Report card** on one course row (staff who manage that course), then this page.
- Pattern B starts from [COURSE_GRADEBOOK](./COURSE_GRADEBOOK.md) **Draft report card** for one student, then **Review** opens this page. Submit is still one card at a time.
- Staff can **Delete draft** while the card is still a draft.
- While the card is a **draft**, the teacher can edit the comment only. **Refresh grades** rewrites the snapshot from the gradebook and keeps the comment.
- **Submit and send** saves a pending comment, marks the card submitted, enqueues deliveries, writes in-app Activity when the recipient has an account, then marks the card sent. The button does not wait on SMTP.
- Email always includes the student when an address exists, and each linked parent. A missing student email records a failed student delivery and does not block submit.
- After send, staff see each email row (queued, sent, or failed). **Resend** re-queues that same failed email row.
- **Print** uses the browser print dialog for this page.
- Status values are `draft`, `submitted`, and `sent`. Only one draft exists per enrollment. Older sent cards can remain.

## Data shown

- Student name, course title, status
- Final percent and derived label, or the teacher override label
- Assignment rows from the snapshot (locked percent and label, or “Not graded”)
- Comment
- Email deliveries (staff): recipient kind, address, status, last error

## Contents

- Grades (read-only on the card)
- Comment
- Draft actions: save comment, refresh grades, submit and send, delete draft
- Email status after send

## Primary actions

- Save comment
- Refresh grades
- Submit and send
- Delete draft
- Resend a failed email
- Print
- Open the gradebook (staff)

## Links to

- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — back
- [COURSE_GRADEBOOK](./COURSE_GRADEBOOK.md) — change a score, then refresh
- [ACTIVITY](./ACTIVITY.md) — in-app notice for a recipient with an account
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md) or [PROGRESS](./PROGRESS.md) by audience, [ORG_SETTINGS](./ORG_SETTINGS.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Progress — grading. Bulk send, parent opt-out, and Resources document templates are out of this slice. Email delivery needs the Resend `report-card` template (**HN-019**).
