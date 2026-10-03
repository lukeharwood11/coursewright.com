-- Distinguish a same-org resource the viewer cannot open from a missing
-- or other-org id. Returns only a state. Never the title or file body.

create or replace function public.resource_open_state(
  p_organization_id bigint,
  p_kind text,
  p_id bigint
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org_id bigint;
  v_archived timestamptz;
begin
  if p_organization_id is null
    or p_id is null
    or p_kind not in ('item', 'folder')
    or not private.is_org_member(p_organization_id)
  then
    return 'missing';
  end if;

  if p_kind = 'item' then
    select i.organization_id, i.archived_at
      into v_org_id, v_archived
    from public.org_resource_items i
    where i.id = p_id;
  else
    select f.organization_id, f.archived_at
      into v_org_id, v_archived
    from public.org_resource_folders f
    where f.id = p_id;
  end if;

  if not found or v_org_id is distinct from p_organization_id then
    return 'missing';
  end if;

  if p_kind = 'item' then
    if private.can_view_org_resource_item(p_id) then
      return 'ok';
    end if;
  elsif private.can_view_org_resource_folder(p_id) then
    return 'ok';
  end if;

  -- Removed rows stay not-found. A live row in this org is permission.
  if v_archived is not null then
    return 'missing';
  end if;
  return 'forbidden';
end;
$$;

revoke all on function public.resource_open_state(bigint, text, bigint) from public;
revoke all on function public.resource_open_state(bigint, text, bigint) from anon;
grant execute on function public.resource_open_state(bigint, text, bigint) to authenticated;

comment on function public.resource_open_state(bigint, text, bigint) is
  'ok, forbidden, or missing for one resource item or folder. No title or file body. Other orgs and non-members are missing.';
