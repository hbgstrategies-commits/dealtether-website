-- ============================================================================
-- PM Portal — deal storage for the private PM acquisitions portal.
-- Only accessible to the hbgstrategies@gmail.com account.
-- ============================================================================

create table if not exists public.pm_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null default 'New Deal',
  status text not null default 'active',   -- active | pass | closed
  questionnaire jsonb not null default '{}',
  qoe_data jsonb,
  qoe_adjs jsonb,
  qoe_notes jsonb,
  eov_inputs jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pm_deals_user_id_idx on public.pm_deals(user_id);
create index if not exists pm_deals_created_at_idx on public.pm_deals(created_at desc);

alter table public.pm_deals enable row level security;

create policy "pm_deals: select own"
  on public.pm_deals for select
  using (auth.uid() = user_id);

create policy "pm_deals: insert own"
  on public.pm_deals for insert
  with check (auth.uid() = user_id);

create policy "pm_deals: update own"
  on public.pm_deals for update
  using (auth.uid() = user_id);

create policy "pm_deals: delete own"
  on public.pm_deals for delete
  using (auth.uid() = user_id);
