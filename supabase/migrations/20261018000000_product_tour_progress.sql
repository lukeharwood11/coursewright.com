-- Account-scoped product tour progress. Absence of a row means the tour is unseen.
-- Not org-scoped. Do not seed rows. A redesigned tour is a new tour_key.

create table public.product_tour_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  tour_key text not null,
  status text not null check (status in ('finished', 'skipped')),
  last_step_index integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, tour_key)
);

alter table public.product_tour_progress enable row level security;

create policy product_tour_progress_select_own on public.product_tour_progress
  for select to authenticated using ((select auth.uid()) = user_id);

create policy product_tour_progress_insert_own on public.product_tour_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy product_tour_progress_update_own on public.product_tour_progress
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.product_tour_progress to authenticated;
