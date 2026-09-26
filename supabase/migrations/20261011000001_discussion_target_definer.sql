-- The org check must see the course or class even when the caller cannot.
-- As security invoker, a hidden row looked like "not in this organization"
-- and the insert policy never got to refuse the discussion.

create or replace function private.discussion_target_in_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_org bigint;
begin
  if new.audience = 'organization' then
    return new;
  end if;

  if new.audience = 'course' then
    select c.organization_id into target_org
    from public.courses c
    where c.id = new.course_id;
  elsif new.audience = 'class' then
    select c.organization_id into target_org
    from public.classes c
    where c.id = new.class_id
      and c.deleted_at is null;
  else
    return new;
  end if;

  if target_org is null or target_org is distinct from new.organization_id then
    raise exception 'That course or class needs to be in this organization.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;
