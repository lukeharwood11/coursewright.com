-- post_discussion_message (SECURITY INVOKER) called
-- private.notify_discussion_message_row, which has EXECUTE revoked from
-- authenticated → "permission denied for function notify_discussion_message_row".
-- Run as definer so the private fan-out is reachable; authz stays in the body.

alter function public.post_discussion_message(bigint, text, uuid[])
  security definer;
