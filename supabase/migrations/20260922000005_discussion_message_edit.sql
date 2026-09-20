-- Authors may edit their own non-deleted message body.
-- Soft-delete rules stay: author or org staff.

create or replace function private.discussion_message_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.discussion_id is distinct from old.discussion_id
     or new.author_id is distinct from old.author_id then
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
    return new;
  end if;

  if new.body is distinct from old.body then
    if old.deleted_at is not null or new.deleted_at is not null then
      raise exception 'This message can’t be edited.'
        using errcode = '23514';
    end if;
    if (select auth.uid()) is distinct from old.author_id then
      raise exception 'You can only edit your own message.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.discussion_message_guard_update() is
  'Allow author body edits; soft-delete by author or staff; lock discussion_id/author_id.';
