-- ============================================================================
-- Tether — initial schema.
-- Run via Supabase CLI: `supabase db push`, or paste into the SQL editor
-- at https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.user, auto-created by trigger on sign-up.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-provision a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- subscriptions: tracks Stripe subscription state per user.
-- Populated ONLY by the Stripe webhook (service role bypasses RLS).
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id text primary key,                  -- Stripe subscription id (sub_...)
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  status text not null,                 -- active, trialing, past_due, canceled, ...
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription. Writes happen server-side via the
-- service role, so no insert/update policy for end-users.
create policy "subscriptions: read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- customers: map Supabase user_id -> Stripe customer_id.
-- One-to-one, created lazily the first time a user hits Stripe checkout.
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

create policy "customers: read own"
  on public.customers for select
  using (auth.uid() = user_id);
