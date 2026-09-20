-- Flatten nested replies into body content. Quotes live in the message body
-- (plain or Lexical JSON), not as separate columns.

-- Guard trigger blocks body rewrites; drop while we migrate former replies.
drop trigger if exists discussion_messages_guard_update on public.discussion_messages;

-- Former replies become flat posts with a Teams-style quote embedded in body.
-- At this point all bodies are still plain text (pre–rich-text composer).
update public.discussion_messages as child
set
  body = jsonb_build_object(
    'v', 1,
    'format', 'plain',
    'quote', jsonb_build_object(
      'authorName', coalesce(
        (
          select nullif(btrim(p.name), '')
          from public.profiles p
          where p.id = parent.author_id
        ),
        'Someone'
      ),
      'text', case
        when char_length(btrim(parent.body)) > 0 then left(btrim(parent.body), 280)
        when exists (
          select 1
          from public.discussion_message_attachments a
          where a.message_id = parent.id
        ) then 'Shared an attachment'
        else ''
      end
    ),
    'text', child.body
  )::text,
  parent_id = null
from public.discussion_messages as parent
where child.parent_id is not null
  and parent.id = child.parent_id;

drop trigger if exists discussion_messages_one_level on public.discussion_messages;
drop function if exists private.discussion_message_one_level();

drop index if exists public.discussion_messages_parent_id_idx;

alter table public.discussion_messages
  drop column parent_id;

create or replace function private.discussion_message_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.discussion_id is distinct from old.discussion_id
     or new.author_id is distinct from old.author_id
     or new.body is distinct from old.body then
    raise exception 'This message can’t be edited.'
      using errcode = '23514';
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    if (select auth.uid()) is distinct from old.author_id
       and not exists (
         select 1
         from public.discussions d
         where d.id = old.discussion_id
           and private.is_org_staff(d.organization_id)
       ) then
      raise exception 'You can only remove your own message.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger discussion_messages_guard_update
before update on public.discussion_messages
for each row execute function private.discussion_message_guard_update();

comment on table public.discussion_messages is
  'SCHEMA.md DiscussionMessage — flat post; body is plain text or Lexical JSON (optional quote in body)';

comment on column public.discussion_messages.body is
  'Plain text, or JSON {v,format,text|lexical,quote?} — quote is Teams-style content in the body, not a FK';
