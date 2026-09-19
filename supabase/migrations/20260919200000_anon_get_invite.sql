-- HN-016: token holders can preview an invite before signing in
-- so signup/login can name and prefill the invited address.
-- Claim still requires an authenticated account on that email.

create or replace function public.get_invite(p_token text)
returns table (
  id bigint,
  organization_id bigint,
  organization_name text,
  organization_slug text,
  email text,
  role text,
  student_profile_id bigint,
  student_name text,
  accepted_at timestamptz,
  email_matches boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
begin
  if caller is not null then
    select p.email into caller_email
    from public.profiles p
    where p.id = caller;
  end if;

  return query
  select
    i.id,
    i.organization_id,
    o.name,
    o.slug,
    i.email,
    i.role,
    i.student_profile_id,
    sp.name,
    i.accepted_at,
    ((caller_email is not null) and (i.email = caller_email)) as email_matches
  from public.admin_invites i
  join public.organizations o on o.id = i.organization_id
  left join public.student_profiles sp on sp.id = i.student_profile_id
  where i.token = p_token;
end;
$$;

revoke all on function public.get_invite(text) from public;
grant execute on function public.get_invite(text) to anon, authenticated;
