# AGENTS — `src/notifications/activity-menu/`

Header **Activity** bell (right of the avatar). Dropdown previews unread notifications; **View all activity** opens the Activity page.

## Scope

- Bell + unread badge in org chrome (not account-level `/my`)
- Top 3 unread; `+ N unread` when there are more
- Empty: **You're all caught up!**
- Click a row to ack and open; same as the Activity list

## Don’t

- Put this in the sidebar.
- Show the bell without an organization in context.
