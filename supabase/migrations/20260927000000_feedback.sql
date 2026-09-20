-- Product feedback from signed-in people (profile menu form).

create table public.feedback (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id),
  organization_id bigint references public.organizations (id) on delete set null,
  name text not null,
  email text not null,
  org_name text,
  org_slug text,
  role text,
  page_path text,
  message text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint feedback_name_chk check (char_length(btrim(name)) > 0),
  constraint feedback_email_chk check (char_length(btrim(email)) > 0),
  constraint feedback_message_chk check (char_length(btrim(message)) > 0),
  constraint feedback_message_len_chk check (char_length(message) <= 8000)
);

create index feedback_created_at_idx on public.feedback (created_at desc);
create index feedback_user_id_idx on public.feedback (user_id);
create index feedback_organization_id_idx on public.feedback (organization_id);

comment on table public.feedback is
  'SCHEMA.md Feedback — signed-in product notes; identity copied from the session';

alter table public.feedback enable row level security;
revoke all on table public.feedback from anon, authenticated;
grant select, insert on table public.feedback to authenticated;
grant select, insert, update, delete on table public.feedback to service_role;

create policy feedback_select on public.feedback
for select to authenticated
using (user_id = (select auth.uid()));

create policy feedback_insert on public.feedback
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    organization_id is null
    or (select private.is_org_member(organization_id))
  )
);
