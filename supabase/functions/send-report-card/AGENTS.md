# AGENTS — `send-report-card`

Send queued `report_card_deliveries` email rows for one submitted card.

## Rules

- API key stays in Edge Function secrets (`RESEND_API_KEY`, **HN-015** / **HN-019**). Never the SPA.
- Submit already enqueued rows and released the card. This function only sends mail.
- Missing student email does not undo submit. The delivery stays `failed` with a reason.
- After 3 failed tries the row stays `failed` for Resend. Do not insert a second delivery row.
- Event name: `report-card`. Payload fields: `organization_name`, `student_name`, `course_title`, `narrative`, `grade_summary`, `report_card_link`, `recipient_kind`.
