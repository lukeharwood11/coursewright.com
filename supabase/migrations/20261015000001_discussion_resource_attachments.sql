-- Discussion messages: attach org resources (P1a) in addition to file / material / url.

alter table public.discussion_message_attachments
  add column resource_item_id bigint references public.org_resource_items (id) on delete cascade;

alter table public.discussion_message_attachments
  drop constraint discussion_message_attachments_kind_chk;

alter table public.discussion_message_attachments
  add constraint discussion_message_attachments_kind_chk
  check (kind in ('file', 'material', 'url', 'resource'));

alter table public.discussion_message_attachments
  drop constraint discussion_message_attachments_payload_chk;

alter table public.discussion_message_attachments
  add constraint discussion_message_attachments_payload_chk check (
    (
      kind = 'file'
      and file_id is not null
      and material_id is null
      and resource_item_id is null
      and url is null
    )
    or (
      kind = 'material'
      and material_id is not null
      and file_id is null
      and resource_item_id is null
      and url is null
    )
    or (
      kind = 'resource'
      and resource_item_id is not null
      and file_id is null
      and material_id is null
      and url is null
    )
    or (
      kind = 'url'
      and char_length(btrim(coalesce(url, ''))) > 0
      and file_id is null
      and material_id is null
      and resource_item_id is null
    )
  );

create index discussion_message_attachments_resource_item_id_idx
  on public.discussion_message_attachments (resource_item_id)
  where resource_item_id is not null;

comment on table public.discussion_message_attachments is
  'SCHEMA.md DiscussionMessageAttachment — file / material / resource / url on a message';

create or replace function private.discussion_attachment_same_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  org_id bigint;
  file_org bigint;
  material_org bigint;
  material_visibility text;
  resource_org bigint;
begin
  select d.organization_id into org_id
  from public.discussion_messages m
  join public.discussions d on d.id = m.discussion_id
  where m.id = new.message_id;

  if org_id is null then
    raise exception 'That message isn’t available.'
      using errcode = '23514';
  end if;

  if new.kind = 'file' then
    select f.organization_id into file_org
    from public.files f
    where f.id = new.file_id
      and f.deleted_at is null;
    if file_org is null or file_org is distinct from org_id then
      raise exception 'That file needs to belong to this organization.'
        using errcode = '23514';
    end if;
  elsif new.kind = 'material' then
    select m.organization_id, m.visibility into material_org, material_visibility
    from public.materials m
    where m.id = new.material_id
      and m.deleted_at is null;
    if material_org is null
       or material_org is distinct from org_id
       or material_visibility is distinct from 'published' then
      raise exception 'Attach a published material from this organization.'
        using errcode = '23514';
    end if;
  elsif new.kind = 'resource' then
    select i.organization_id into resource_org
    from public.org_resource_items i
    where i.id = new.resource_item_id
      and i.archived_at is null;
    if resource_org is null
       or resource_org is distinct from org_id
       or not private.can_view_org_resource_item(new.resource_item_id) then
      raise exception 'Attach a resource you can view from this organization.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;
