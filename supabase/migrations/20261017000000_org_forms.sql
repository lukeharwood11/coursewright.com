-- US-58 Forms (P1b): a resource item type, not a second nav and not materials.
-- Publish state lives on org_resource_items.visibility. org_forms.status mirrors it.
-- Responses are membership + collection visibility. Not enrollment / parent_student_links
-- as an access gate (that link is only which student a response is about).

alter table public.org_resource_items
  drop constraint org_resource_items_type_chk,
  drop constraint org_resource_items_payload_chk;

alter table public.org_resource_items
  add constraint org_resource_items_type_chk check (
    type in ('document', 'link', 'file', 'form')
  ),
  add constraint org_resource_items_payload_chk check (
    (type = 'document' and url is null)
    or (type = 'link' and url is not null and file_id is null)
    or (type = 'file' and file_id is not null and url is null)
    or (type = 'form' and url is null and file_id is null)
  );

create table public.org_forms (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  item_id bigint not null references public.org_resource_items (id) on delete cascade,
  schema_json jsonb not null default '{"subject":"none","fields":[]}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_forms_item_id_key unique (item_id),
  constraint org_forms_status_chk check (status in ('draft', 'published')),
  constraint org_forms_schema_object_chk check (jsonb_typeof(schema_json) = 'object')
);

create index org_forms_organization_id_idx on public.org_forms (organization_id);

comment on table public.org_forms is
  'US-58 form definition owned by one org_resource_items row of type form. No branching.';
comment on column public.org_forms.status is
  'Mirror of the resource item visibility. Unpublished = draft. Do not publish from this column alone.';

create trigger org_forms_set_updated_at
before update on public.org_forms
for each row execute function private.set_updated_at();

create table public.org_form_submissions (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  form_id bigint not null references public.org_forms (id) on delete cascade,
  submitted_by uuid not null references public.profiles (id),
  subject_student_profile_id bigint references public.org_profiles (id) on delete restrict,
  payload_json jsonb not null,
  submitted_at timestamptz not null default now(),
  constraint org_form_submissions_payload_object_chk check (
    jsonb_typeof(payload_json) = 'object'
  )
);

create index org_form_submissions_form_submitted_idx
  on public.org_form_submissions (form_id, submitted_at desc);
create index org_form_submissions_submitted_by_idx
  on public.org_form_submissions (submitted_by);
create index org_form_submissions_subject_student_idx
  on public.org_form_submissions (subject_student_profile_id);

comment on table public.org_form_submissions is
  'US-58 responses. Staff who can edit the form read every row; a person reads their own. Optional subject student is not an enrollment gate.';

-- ---------------------------------------------------------------------------
-- Schema + response checks
-- ---------------------------------------------------------------------------

create or replace function private.org_form_status_for_visibility(p_visibility text)
returns text
language sql
immutable
as $$
  select case when p_visibility = 'published' then 'published' else 'draft' end;
$$;

create or replace function private.assert_org_form_schema(p_schema jsonb)
returns void
language plpgsql
immutable
as $$
declare
  field jsonb;
  seen text[] := '{}';
  fid text;
  kind text;
  label text;
  opt text;
  option_count int;
  field_count int;
  subject_mode text;
begin
  if jsonb_typeof(p_schema) is distinct from 'object' then
    raise exception 'Form questions must be an object.';
  end if;
  if octet_length(p_schema::text) > 64000 then
    raise exception 'This form is too large.';
  end if;
  subject_mode := coalesce(p_schema->>'subject', 'none');
  if subject_mode not in ('none', 'optional', 'required') then
    raise exception 'Choose whether this form asks for a student.';
  end if;
  if jsonb_typeof(coalesce(p_schema->'fields', '[]'::jsonb)) is distinct from 'array' then
    raise exception 'Form questions must be a list.';
  end if;
  field_count := jsonb_array_length(coalesce(p_schema->'fields', '[]'::jsonb));
  if field_count > 40 then
    raise exception 'A form can have at most 40 questions.';
  end if;
  for field in
    select value from jsonb_array_elements(coalesce(p_schema->'fields', '[]'::jsonb))
  loop
    if jsonb_typeof(field) is distinct from 'object' then
      raise exception 'Each question must be an object.';
    end if;
    fid := field->>'id';
    kind := field->>'kind';
    label := btrim(coalesce(field->>'label', ''));
    if fid is null or fid !~ '^[A-Za-z0-9_-]{1,40}$' then
      raise exception 'Each question needs a short id.';
    end if;
    if fid = any (seen) then
      raise exception 'Each question id must be unique.';
    end if;
    seen := array_append(seen, fid);
    if label = '' or char_length(label) > 200 then
      raise exception 'Name every question (200 characters or fewer).';
    end if;
    if kind not in ('short_text', 'long_text', 'yes_no', 'choice', 'date') then
      raise exception 'That question type isn’t supported.';
    end if;
    if field ? 'required' and jsonb_typeof(field->'required') is distinct from 'boolean' then
      raise exception 'Required must be yes or no.';
    end if;
    if kind = 'choice' then
      if jsonb_typeof(coalesce(field->'options', '[]'::jsonb)) is distinct from 'array' then
        raise exception 'Choice questions need a list of options.';
      end if;
      option_count := 0;
      for opt in
        select value from jsonb_array_elements_text(coalesce(field->'options', '[]'::jsonb))
      loop
        if btrim(opt) = '' or char_length(opt) > 200 then
          raise exception 'Each option needs a name (200 characters or fewer).';
        end if;
        option_count := option_count + 1;
      end loop;
      if option_count < 1 or option_count > 12 then
        raise exception 'A choice question needs 1 to 12 options.';
      end if;
    end if;
  end loop;
end;
$$;

create or replace function private.org_forms_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  item_org bigint;
  item_type text;
  item_visibility text;
begin
  select organization_id, type, visibility
    into item_org, item_type, item_visibility
  from public.org_resource_items
  where id = new.item_id;
  if not found then
    raise exception 'That resource isn’t available.';
  end if;
  if item_type is distinct from 'form' then
    raise exception 'Only a form resource can hold questions.';
  end if;
  if item_org is distinct from new.organization_id then
    raise exception 'Form must stay in the same organization as its resource.';
  end if;
  perform private.assert_org_form_schema(new.schema_json);
  new.status := private.org_form_status_for_visibility(item_visibility);
  return new;
end;
$$;

create trigger org_forms_before_write
before insert or update of item_id, organization_id, schema_json, status
on public.org_forms
for each row execute function private.org_forms_before_write();

create or replace function private.org_resource_item_ensure_form()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'form' then
    insert into public.org_forms (organization_id, item_id)
    values (new.organization_id, new.id)
    on conflict (item_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger org_resource_items_ensure_form
after insert on public.org_resource_items
for each row execute function private.org_resource_item_ensure_form();

create or replace function private.org_resource_item_sync_form_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'form' and new.visibility is distinct from old.visibility then
    update public.org_forms
    set status = private.org_form_status_for_visibility(new.visibility)
    where item_id = new.id
      and status is distinct from private.org_form_status_for_visibility(new.visibility);
  end if;
  return new;
end;
$$;

create trigger org_resource_items_sync_form_status
after update of visibility on public.org_resource_items
for each row execute function private.org_resource_item_sync_form_status();

create or replace function private.org_form_submissions_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  form public.org_forms%rowtype;
  item public.org_resource_items%rowtype;
  field jsonb;
  fid text;
  kind text;
  required boolean;
  answer jsonb;
  opt text;
  matched boolean;
  subject_mode text;
  student_org bigint;
  student_counts boolean;
  key text;
begin
  if tg_op <> 'INSERT' then
    raise exception 'A response can’t be edited after it’s sent.';
  end if;
  select * into form from public.org_forms where id = new.form_id;
  if not found then
    raise exception 'That form isn’t available.';
  end if;
  if new.organization_id is distinct from form.organization_id then
    raise exception 'Response must stay in the same organization.';
  end if;
  select * into item from public.org_resource_items where id = form.item_id;
  if not found or item.archived_at is not null or item.type is distinct from 'form' then
    raise exception 'That form isn’t available.';
  end if;
  if item.visibility is distinct from 'published' then
    raise exception 'Publish the form before collecting responses.';
  end if;
  if (select auth.uid()) is not null and new.submitted_by is distinct from (select auth.uid()) then
    raise exception 'You can only send your own response.';
  end if;

  subject_mode := coalesce(form.schema_json->>'subject', 'none');
  if subject_mode not in ('none', 'optional', 'required') then
    subject_mode := 'none';
  end if;
  if subject_mode = 'none' and new.subject_student_profile_id is not null then
    raise exception 'This form doesn’t ask for a student.';
  end if;
  if subject_mode = 'required' and new.subject_student_profile_id is null then
    raise exception 'Choose a student.';
  end if;
  if new.subject_student_profile_id is not null then
    select organization_id, counts_as_student
      into student_org, student_counts
    from public.org_profiles
    where id = new.subject_student_profile_id;
    if student_org is distinct from form.organization_id or student_counts is not true then
      raise exception 'That student isn’t in this organization.';
    end if;
    if not private.is_org_staff(form.organization_id)
       and not private.parent_linked_to_student(new.subject_student_profile_id)
       and not exists (
         select 1
         from public.org_profiles sp
         where sp.id = new.subject_student_profile_id
           and sp.user_id = (select auth.uid())
           and sp.counts_as_student
       ) then
      raise exception 'You can’t send this form for that student.';
    end if;
  end if;

  if jsonb_typeof(new.payload_json) is distinct from 'object' then
    raise exception 'Responses must be an object.';
  end if;
  if octet_length(new.payload_json::text) > 48000 then
    raise exception 'That response is too long.';
  end if;

  for key in select jsonb_object_keys(new.payload_json)
  loop
    if not exists (
      select 1
      from jsonb_array_elements(coalesce(form.schema_json->'fields', '[]'::jsonb)) f
      where f->>'id' = key
    ) then
      raise exception 'That response includes a question this form doesn’t ask.';
    end if;
  end loop;

  for field in
    select value from jsonb_array_elements(coalesce(form.schema_json->'fields', '[]'::jsonb))
  loop
    fid := field->>'id';
    kind := field->>'kind';
    required := coalesce((field->>'required')::boolean, false);
    answer := new.payload_json->fid;
    if answer is null or answer = 'null'::jsonb or answer = '""'::jsonb then
      if required then
        raise exception 'Answer every required question.';
      end if;
      continue;
    end if;
    if kind in ('short_text', 'long_text', 'date') then
      if jsonb_typeof(answer) is distinct from 'string' then
        raise exception 'That answer doesn’t match the question.';
      end if;
      if kind = 'short_text' and char_length(answer #>> '{}') > 500 then
        raise exception 'A short answer must be 500 characters or fewer.';
      end if;
      if kind = 'long_text' and char_length(answer #>> '{}') > 8000 then
        raise exception 'A long answer must be 8000 characters or fewer.';
      end if;
      if kind = 'date' and (answer #>> '{}') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
        raise exception 'Use a date.';
      end if;
    elsif kind = 'yes_no' then
      if jsonb_typeof(answer) is distinct from 'boolean' then
        raise exception 'Answer yes or no.';
      end if;
    elsif kind = 'choice' then
      if jsonb_typeof(answer) is distinct from 'string' then
        raise exception 'Choose one of the listed options.';
      end if;
      matched := false;
      for opt in
        select value from jsonb_array_elements_text(coalesce(field->'options', '[]'::jsonb))
      loop
        if opt = (answer #>> '{}') then
          matched := true;
        end if;
      end loop;
      if not matched then
        raise exception 'Choose one of the listed options.';
      end if;
    else
      raise exception 'That question type isn’t supported.';
    end if;
  end loop;

  if jsonb_array_length(coalesce(form.schema_json->'fields', '[]'::jsonb)) = 0
     and subject_mode = 'none' then
    raise exception 'This form has nothing to fill in.';
  end if;

  new.submitted_at := now();
  return new;
end;
$$;

create trigger org_form_submissions_before_write
before insert on public.org_form_submissions
for each row execute function private.org_form_submissions_before_write();

revoke all on function private.org_form_status_for_visibility(text) from public, anon;
revoke all on function private.assert_org_form_schema(jsonb) from public, anon;
grant execute on function private.org_form_status_for_visibility(text) to authenticated, service_role;
grant execute on function private.assert_org_form_schema(jsonb) to authenticated, service_role;
revoke all on function private.org_forms_before_write() from public, anon, authenticated;
revoke all on function private.org_resource_item_ensure_form() from public, anon, authenticated;
revoke all on function private.org_resource_item_sync_form_status() from public, anon, authenticated;
revoke all on function private.org_form_submissions_before_write() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------

grant select, update on table public.org_forms to authenticated;
grant select, insert on table public.org_form_submissions to authenticated;
grant select, insert, update, delete on table public.org_forms to service_role;
grant select, insert, update, delete on table public.org_form_submissions to service_role;
grant usage, select on sequence public.org_forms_id_seq to authenticated, service_role;
grant usage, select on sequence public.org_form_submissions_id_seq to authenticated, service_role;

alter table public.org_forms enable row level security;
alter table public.org_form_submissions enable row level security;

create policy org_forms_select on public.org_forms
for select to authenticated
using ((select private.can_view_org_resource_item(item_id)));

create policy org_forms_update on public.org_forms
for update to authenticated
using ((select private.can_edit_org_resource_item(item_id)))
with check ((select private.can_edit_org_resource_item(item_id)));

create policy org_form_submissions_select on public.org_form_submissions
for select to authenticated
using (
  submitted_by = (select auth.uid())
  or exists (
    select 1
    from public.org_forms f
    where f.id = form_id
      and (select private.can_edit_org_resource_item(f.item_id))
  )
);

create policy org_form_submissions_insert on public.org_form_submissions
for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and exists (
    select 1
    from public.org_forms f
    join public.org_resource_items i on i.id = f.item_id
    where f.id = form_id
      and f.organization_id = organization_id
      and i.archived_at is null
      and i.visibility = 'published'
      and i.type = 'form'
      and (select private.can_view_org_resource_item(i.id))
  )
);
