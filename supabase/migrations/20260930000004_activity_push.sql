-- Device push for unread Activity rows. Delivery is best-effort: if Vault
-- secrets are missing (HN-018) or pg_net cannot run, the Activity write still
-- commits.

do $$
begin
  create extension if not exists pg_net;
exception
  when others then
    raise warning 'pg_net not installed: %', sqlerrm;
end;
$$;

do $$
begin
  create extension if not exists supabase_vault;
exception
  when others then
    raise warning 'supabase_vault not installed: %', sqlerrm;
end;
$$;

create table public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint),
  constraint push_subscriptions_endpoint_chk check (
    char_length(btrim(endpoint)) > 0 and char_length(endpoint) <= 2000
  ),
  constraint push_subscriptions_p256dh_chk check (char_length(btrim(p256dh)) > 0),
  constraint push_subscriptions_auth_chk check (char_length(btrim(auth)) > 0)
);

create index push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'SCHEMA.md PushSubscription — Web Push endpoint for one installed app. Own rows only.';

alter table public.push_subscriptions enable row level security;

revoke all on table public.push_subscriptions from anon, authenticated;

grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant select, insert, update, delete on table public.push_subscriptions to service_role;
grant usage, select on sequence public.push_subscriptions_id_seq to authenticated, service_role;

create policy push_subscriptions_select on public.push_subscriptions
for select to authenticated
using (user_id = (select auth.uid()));

create policy push_subscriptions_insert on public.push_subscriptions
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy push_subscriptions_update on public.push_subscriptions
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy push_subscriptions_delete on public.push_subscriptions
for delete to authenticated
using (user_id = (select auth.uid()));

-- The browser endpoint is a capability for this device. Signing in as someone
-- else on the same installed app moves the row to that person.
create or replace function public.claim_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Sign in to turn on notifications.'
      using errcode = '42501';
  end if;

  if p_endpoint is null
     or char_length(btrim(p_endpoint)) = 0
     or char_length(p_endpoint) > 2000
     or p_p256dh is null
     or char_length(btrim(p_p256dh)) = 0
     or p_auth is null
     or char_length(btrim(p_auth)) = 0 then
    raise exception 'That notification setup is incomplete.'
      using errcode = '23514';
  end if;

  insert into public.push_subscriptions (
    user_id,
    endpoint,
    p256dh,
    auth,
    updated_at
  )
  values (
    uid,
    p_endpoint,
    p_p256dh,
    p_auth,
    now()
  )
  on conflict (endpoint) do update
  set
    user_id = excluded.user_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    updated_at = now();
end;
$$;

revoke all on function public.claim_push_subscription(text, text, text) from public;
revoke all on function public.claim_push_subscription(text, text, text) from anon;
grant execute on function public.claim_push_subscription(text, text, text) to authenticated;

create or replace function private.enqueue_activity_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
  function_url text;
begin
  if new.read_at is not null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.read_at is null
       and old.kind is not distinct from new.kind
       and old.title is not distinct from new.title
       and old.preview is not distinct from new.preview
       and old.audience_label is not distinct from new.audience_label
       and old.discussion_id is not distinct from new.discussion_id
       and old.discussion_message_id is not distinct from new.discussion_message_id
       and old.announcement_id is not distinct from new.announcement_id
       and old.actor_id is not distinct from new.actor_id
       and old.created_at is not distinct from new.created_at then
      return new;
    end if;
  end if;

  begin
    select s.decrypted_secret
    into secret
    from vault.decrypted_secrets s
    where s.name = 'activity_push_webhook_secret'
    limit 1;

    select s.decrypted_secret
    into function_url
    from vault.decrypted_secrets s
    where s.name = 'activity_push_function_url'
    limit 1;

    if secret is null
       or btrim(secret) = ''
       or function_url is null
       or btrim(function_url) = '' then
      return new;
    end if;

    perform net.http_post(
      url := function_url,
      body := jsonb_build_object('notification_id', new.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', secret
      ),
      timeout_milliseconds := 10000
    );
  exception
    when others then
      -- HN-018: Vault or pg_net may be unset. Activity must still save.
      raise warning 'activity push skipped: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function private.enqueue_activity_push() from public, anon, authenticated;

create trigger notifications_enqueue_activity_push
after insert or update on public.notifications
for each row
when (new.read_at is null)
execute function private.enqueue_activity_push();

comment on function private.enqueue_activity_push() is
  'Queues send-activity-push for an unread Activity row. No-ops without Vault secrets (HN-018).';
