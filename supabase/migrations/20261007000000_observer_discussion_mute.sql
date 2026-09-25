-- Observers can read discussions (can_see_discussion uses can_browse_as_staff)
-- but must not post. post_discussion_message is security definer and only
-- checked visibility, so an observer reply bypassed RLS.
--
-- is_org_staff stays writers only. Family start/reply checks are unchanged
-- for parent and student. An active observer is mute even when is_parent
-- would otherwise pass parent_can_view_discussion / can_start_discussion.

create or replace function private.can_start_discussion(
  p_org_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    not exists (
      select 1
      from public.memberships m
      where m.organization_id = p_org_id
        and m.user_id = (select auth.uid())
        and m.role = 'observer'
        and m.status = 'active'
    )
    and case p_audience
      when 'course' then
        p_course_id is not null
        and exists (
          select 1
          from public.courses c
          where c.id = p_course_id
            and c.organization_id = p_org_id
        )
        and (
          private.can_manage_course(p_course_id)
          or private.parent_can_view_course(p_course_id)
          or private.student_can_view_course(p_course_id)
        )
      when 'class' then
        p_class_id is not null
        and exists (
          select 1
          from public.classes c
          where c.id = p_class_id
            and c.organization_id = p_org_id
            and c.deleted_at is null
        )
        and (
          private.is_org_staff(p_org_id)
          or private.parent_linked_to_class(p_class_id)
          or private.student_linked_to_class(p_class_id)
        )
      else false
    end;
$$;

drop policy if exists discussion_messages_insert on public.discussion_messages;
create policy discussion_messages_insert on public.discussion_messages
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and not exists (
    select 1
    from public.discussions d
    join public.memberships m
      on m.organization_id = d.organization_id
     and m.user_id = (select auth.uid())
     and m.role = 'observer'
     and m.status = 'active'
    where d.id = discussion_id
  )
  and exists (
    select 1
    from public.discussions d
    where d.id = discussion_id
      and d.deleted_at is null
      and (
        (select private.is_org_staff(d.organization_id))
        or (select private.parent_can_view_discussion(d.id))
      )
  )
);

create or replace function public.post_discussion_message(
  p_discussion_id bigint,
  p_body text,
  p_mentioned_user_ids uuid[] default '{}'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  msg_id bigint;
  mention_id uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Sign in to post.'
      using errcode = '42501';
  end if;

  if p_discussion_id is null then
    raise exception 'That discussion couldn’t be found.'
      using errcode = '22023';
  end if;

  -- Visibility is not a write grant. Observers browse via can_see_discussion.
  if exists (
    select 1
    from public.discussions d
    join public.memberships m
      on m.organization_id = d.organization_id
     and m.user_id = uid
     and m.role = 'observer'
     and m.status = 'active'
    where d.id = p_discussion_id
  ) then
    raise exception 'You can’t post in this discussion.'
      using errcode = '42501';
  end if;

  if not private.can_see_discussion(p_discussion_id) then
    raise exception 'You can’t post in this discussion.'
      using errcode = '42501';
  end if;

  perform set_config('coursewright.skip_discussion_message_notify', '1', true);

  insert into public.discussion_messages (
    discussion_id,
    author_id,
    body
  )
  values (
    p_discussion_id,
    uid,
    coalesce(p_body, '')
  )
  returning id into msg_id;

  if p_mentioned_user_ids is not null then
    foreach mention_id in array p_mentioned_user_ids
    loop
      if mention_id is null or mention_id is not distinct from uid then
        continue;
      end if;
      insert into public.discussion_message_mentions (message_id, user_id)
      values (msg_id, mention_id)
      on conflict (message_id, user_id) do nothing;
    end loop;
  end if;

  perform set_config('coursewright.skip_discussion_message_notify', '0', true);

  perform private.notify_discussion_message_row(
    msg_id,
    p_discussion_id,
    uid,
    coalesce(p_body, ''),
    null
  );

  return msg_id;
exception
  when others then
    perform set_config('coursewright.skip_discussion_message_notify', '0', true);
    raise;
end;
$$;

revoke all on function public.post_discussion_message(bigint, text, uuid[])
  from public, anon;
grant execute on function public.post_discussion_message(bigint, text, uuid[])
  to authenticated;

comment on function public.post_discussion_message(bigint, text, uuid[]) is
  'Insert a discussion post and optional @mentions. Observers cannot post. Writers and families who can see the thread still can.';
