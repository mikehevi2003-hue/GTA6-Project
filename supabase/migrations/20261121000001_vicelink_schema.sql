-- =============================================================================
-- ViceLink Leonida Hub — commercial schema (Supabase project bdtewmmtnfnbjwajmvdg)
--
-- IMPORTANT: this project is SHARED with another application. Every object
-- created here is prefixed with `vicelink_` and this migration NEVER touches
-- pre-existing tables (transactions, portfolio, credit_cards, accounts,
-- user_settings, ...).
--
-- Security model
--   * RLS ENABLED + FORCED on every table.
--   * anon has NO privileges on any vicelink_* table.
--   * authenticated gets least privilege; policies always use
--     `(select auth.uid()) = user_id` (never auth.role(), never user_metadata).
--   * vicelink_transactions is read-only to end users; only service_role
--     (server webhooks) writes payments.
--   * access_tier / stripe_customer_id can only be changed by service_role
--     or database owners (guard trigger).
-- =============================================================================

-- gen_random_uuid() is built into Postgres 13+, no extension required.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.vicelink_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  handle text not null,
  display_name text not null default '',
  access_tier text not null default 'free' check (access_tier in ('free','street','kingpin')),
  preferred_lang text not null default 'en' check (preferred_lang in ('en','es')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vicelink_profiles_handle_format check (handle ~ '^@[A-Za-z0-9_]{2,24}$'),
  constraint vicelink_profiles_display_name_len check (char_length(display_name) <= 60)
);

create table if not exists public.vicelink_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.vicelink_profiles(user_id) on delete cascade,
  provider text not null check (provider in ('yappy','tilopay','paguelofacil','stripe')),
  provider_order_id text unique not null,
  target_tier text not null check (target_tier in ('street','kingpin')),
  amount_usd numeric(6,2) not null check (amount_usd >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','completed','failed','refunded')),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vicelink_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorites text[] not null default '{}',
  unlocked_cheats text[] not null default '{}',
  found_pins text[] not null default '{}',
  planned_vehicles text[] not null default '{}',
  planned_props text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.vicelink_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, usage_date)
);

create table if not exists public.vicelink_glitch_votes (
  glitch_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (glitch_id, user_id)
);

create table if not exists public.vicelink_theories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_handle text not null,
  title text not null check (char_length(title) between 1 and 140),
  tag text not null check (char_length(tag) between 1 and 60),
  coords text not null default '' check (char_length(coords) <= 140),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.vicelink_theory_votes (
  theory_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (theory_id, user_id)
);

create table if not exists public.vicelink_theory_reactions (
  theory_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 16),
  primary key (theory_id, user_id, emoji)
);

create table if not exists public.vicelink_comments (
  id uuid primary key default gen_random_uuid(),
  theory_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_handle text not null,
  body text not null default '' check (char_length(body) <= 500),
  gif_id text not null default '' check (char_length(gif_id) <= 32),
  created_at timestamptz not null default now()
);

create table if not exists public.vicelink_comment_likes (
  comment_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (comment_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Indexes (user_id + lookup columns)
-- -----------------------------------------------------------------------------

create index if not exists vicelink_profiles_handle_idx on public.vicelink_profiles (handle);
create index if not exists vicelink_profiles_stripe_customer_idx on public.vicelink_profiles (stripe_customer_id) where stripe_customer_id is not null;

create index if not exists vicelink_transactions_user_id_idx on public.vicelink_transactions (user_id);
create index if not exists vicelink_transactions_status_idx on public.vicelink_transactions (status);
create index if not exists vicelink_transactions_created_at_idx on public.vicelink_transactions (created_at desc);

create index if not exists vicelink_ai_usage_user_id_idx on public.vicelink_ai_usage (user_id);

create index if not exists vicelink_glitch_votes_user_id_idx on public.vicelink_glitch_votes (user_id);
create index if not exists vicelink_glitch_votes_glitch_id_idx on public.vicelink_glitch_votes (glitch_id);

create index if not exists vicelink_theories_user_id_idx on public.vicelink_theories (user_id);
create index if not exists vicelink_theories_created_at_idx on public.vicelink_theories (created_at desc);

create index if not exists vicelink_theory_votes_user_id_idx on public.vicelink_theory_votes (user_id);
create index if not exists vicelink_theory_votes_theory_id_idx on public.vicelink_theory_votes (theory_id);

create index if not exists vicelink_theory_reactions_user_id_idx on public.vicelink_theory_reactions (user_id);
create index if not exists vicelink_theory_reactions_theory_id_idx on public.vicelink_theory_reactions (theory_id);

create index if not exists vicelink_comments_user_id_idx on public.vicelink_comments (user_id);
create index if not exists vicelink_comments_theory_id_idx on public.vicelink_comments (theory_id, created_at);

create index if not exists vicelink_comment_likes_user_id_idx on public.vicelink_comment_likes (user_id);
create index if not exists vicelink_comment_likes_comment_id_idx on public.vicelink_comment_likes (comment_id);

-- -----------------------------------------------------------------------------
-- Row Level Security (ENABLE + FORCE on every table)
-- -----------------------------------------------------------------------------

alter table public.vicelink_profiles enable row level security;
alter table public.vicelink_profiles force row level security;
alter table public.vicelink_transactions enable row level security;
alter table public.vicelink_transactions force row level security;
alter table public.vicelink_progress enable row level security;
alter table public.vicelink_progress force row level security;
alter table public.vicelink_ai_usage enable row level security;
alter table public.vicelink_ai_usage force row level security;
alter table public.vicelink_glitch_votes enable row level security;
alter table public.vicelink_glitch_votes force row level security;
alter table public.vicelink_theories enable row level security;
alter table public.vicelink_theories force row level security;
alter table public.vicelink_theory_votes enable row level security;
alter table public.vicelink_theory_votes force row level security;
alter table public.vicelink_theory_reactions enable row level security;
alter table public.vicelink_theory_reactions force row level security;
alter table public.vicelink_comments enable row level security;
alter table public.vicelink_comments force row level security;
alter table public.vicelink_comment_likes enable row level security;
alter table public.vicelink_comment_likes force row level security;

-- -----------------------------------------------------------------------------
-- Privileges: nothing for anon, least privilege for authenticated.
-- -----------------------------------------------------------------------------

revoke all on public.vicelink_profiles from anon, public;
revoke all on public.vicelink_transactions from anon, public;
revoke all on public.vicelink_progress from anon, public;
revoke all on public.vicelink_ai_usage from anon, public;
revoke all on public.vicelink_glitch_votes from anon, public;
revoke all on public.vicelink_theories from anon, public;
revoke all on public.vicelink_theory_votes from anon, public;
revoke all on public.vicelink_theory_reactions from anon, public;
revoke all on public.vicelink_comments from anon, public;
revoke all on public.vicelink_comment_likes from anon, public;

revoke all on public.vicelink_profiles from authenticated;
revoke all on public.vicelink_transactions from authenticated;
revoke all on public.vicelink_progress from authenticated;
revoke all on public.vicelink_ai_usage from authenticated;
revoke all on public.vicelink_glitch_votes from authenticated;
revoke all on public.vicelink_theories from authenticated;
revoke all on public.vicelink_theory_votes from authenticated;
revoke all on public.vicelink_theory_reactions from authenticated;
revoke all on public.vicelink_comments from authenticated;
revoke all on public.vicelink_comment_likes from authenticated;

grant select, insert, update, delete on public.vicelink_profiles to authenticated;
grant select on public.vicelink_transactions to authenticated;          -- payments: read-only for users
grant select, insert, update, delete on public.vicelink_progress to authenticated;
-- AI quota counters are read-only for users: increments happen exclusively
-- through public.vicelink_consume_ai_quota() so a user can never reset
-- their own daily counter via PostgREST.
grant select on public.vicelink_ai_usage to authenticated;
grant select, insert, update, delete on public.vicelink_glitch_votes to authenticated;
grant select, insert, update, delete on public.vicelink_theories to authenticated;
grant select, insert, update, delete on public.vicelink_theory_votes to authenticated;
grant select, insert, update, delete on public.vicelink_theory_reactions to authenticated;
grant select, insert, update, delete on public.vicelink_comments to authenticated;
grant select, insert, update, delete on public.vicelink_comment_likes to authenticated;

grant all on public.vicelink_profiles to service_role;
grant all on public.vicelink_transactions to service_role;
grant all on public.vicelink_progress to service_role;
grant all on public.vicelink_ai_usage to service_role;
grant all on public.vicelink_glitch_votes to service_role;
grant all on public.vicelink_theories to service_role;
grant all on public.vicelink_theory_votes to service_role;
grant all on public.vicelink_theory_reactions to service_role;
grant all on public.vicelink_comments to service_role;
grant all on public.vicelink_comment_likes to service_role;

-- -----------------------------------------------------------------------------
-- Policies
-- -----------------------------------------------------------------------------

-- vicelink_profiles: owner-only. No DELETE policy (account deletion cascades
-- from auth.users; users must not wipe their own payment ledger).
drop policy if exists vicelink_profiles_select_own on public.vicelink_profiles;
create policy vicelink_profiles_select_own on public.vicelink_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists vicelink_profiles_insert_own on public.vicelink_profiles;
create policy vicelink_profiles_insert_own on public.vicelink_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists vicelink_profiles_update_own on public.vicelink_profiles;
create policy vicelink_profiles_update_own on public.vicelink_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- vicelink_transactions: owner may only read their own receipts.
drop policy if exists vicelink_transactions_select_own on public.vicelink_transactions;
create policy vicelink_transactions_select_own on public.vicelink_transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- vicelink_progress: owner-only CRUD.
drop policy if exists vicelink_progress_select_own on public.vicelink_progress;
create policy vicelink_progress_select_own on public.vicelink_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists vicelink_progress_insert_own on public.vicelink_progress;
create policy vicelink_progress_insert_own on public.vicelink_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists vicelink_progress_update_own on public.vicelink_progress;
create policy vicelink_progress_update_own on public.vicelink_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists vicelink_progress_delete_own on public.vicelink_progress;
create policy vicelink_progress_delete_own on public.vicelink_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- vicelink_ai_usage: owner may read own counters only.
drop policy if exists vicelink_ai_usage_select_own on public.vicelink_ai_usage;
create policy vicelink_ai_usage_select_own on public.vicelink_ai_usage
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Community tables: readable by every authenticated user, writable by owner.
do $$
declare
  t text;
begin
  foreach t in array array[
    'vicelink_theories',
    'vicelink_comments',
    'vicelink_glitch_votes',
    'vicelink_theory_votes',
    'vicelink_theory_reactions',
    'vicelink_comment_likes'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_all', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select_all', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function private.vicelink_tier_rank(p_tier text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_tier when 'kingpin' then 2 when 'street' then 1 else 0 end;
$$;

revoke execute on function private.vicelink_tier_rank(text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Guard trigger: end users can never change their own tier / billing id.
-- -----------------------------------------------------------------------------

create or replace function private.vicelink_guard_profile_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Self-service inserts (e.g. missing-profile recovery) always start free.
    if coalesce(auth.jwt()->>'role', '') <> 'service_role'
       and current_user not in ('service_role', 'postgres', 'supabase_admin') then
      new.access_tier := 'free';
      new.stripe_customer_id := null;
    end if;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  if (new.access_tier is distinct from old.access_tier
      or new.stripe_customer_id is distinct from old.stripe_customer_id)
     and coalesce(auth.jwt()->>'role', '') <> 'service_role'
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'VICELINK_TIER_PROTECTED: access_tier and stripe_customer_id are managed by the payment server'
      using errcode = '42501';
  end if;

  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.vicelink_guard_profile_tier() from public, anon, authenticated;

drop trigger if exists vicelink_guard_profile_tier on public.vicelink_profiles;
create trigger vicelink_guard_profile_tier
  before update on public.vicelink_profiles
  for each row execute function private.vicelink_guard_profile_tier();

drop trigger if exists vicelink_guard_profile_tier_insert on public.vicelink_profiles;
create trigger vicelink_guard_profile_tier_insert
  before insert on public.vicelink_profiles
  for each row execute function private.vicelink_guard_profile_tier();

-- updated_at on progress
create or replace function private.vicelink_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.vicelink_touch_updated_at() from public, anon, authenticated;

drop trigger if exists vicelink_progress_touch on public.vicelink_progress;
create trigger vicelink_progress_touch
  before update on public.vicelink_progress
  for each row execute function private.vicelink_touch_updated_at();

-- Author handles on community content always mirror the verified profile
-- handle (prevents impersonating another @handle via direct PostgREST writes).
create or replace function private.vicelink_set_author_handle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_handle text;
begin
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
  end if;

  select p.handle into v_handle
  from public.vicelink_profiles p
  where p.user_id = new.user_id;

  if v_handle is null then
    raise exception 'VICELINK_PROFILE_REQUIRED' using errcode = '23503';
  end if;

  new.author_handle := v_handle;
  return new;
end;
$$;

revoke execute on function private.vicelink_set_author_handle() from public, anon, authenticated;

drop trigger if exists vicelink_theories_author_handle on public.vicelink_theories;
create trigger vicelink_theories_author_handle
  before insert or update on public.vicelink_theories
  for each row execute function private.vicelink_set_author_handle();

drop trigger if exists vicelink_comments_author_handle on public.vicelink_comments;
create trigger vicelink_comments_author_handle
  before insert or update on public.vicelink_comments
  for each row execute function private.vicelink_set_author_handle();

-- -----------------------------------------------------------------------------
-- New auth user -> profile + progress rows
-- -----------------------------------------------------------------------------

create or replace function private.vicelink_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := coalesce(new.email, '');
  v_prefix text;
begin
  v_prefix := left(regexp_replace(split_part(v_email, '@', 1), '[^A-Za-z0-9_]', '', 'g'), 18);
  if char_length(v_prefix) < 2 then
    v_prefix := 'agent_' || left(replace(new.id::text, '-', ''), 6);
  end if;

  insert into public.vicelink_profiles (user_id, email, handle, display_name)
  values (new.id, v_email, '@' || v_prefix, v_prefix)
  on conflict (user_id) do nothing;

  insert into public.vicelink_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.vicelink_handle_new_user() from public, anon, authenticated;

drop trigger if exists vicelink_on_auth_user_created on auth.users;
create trigger vicelink_on_auth_user_created
  after insert on auth.users
  for each row execute function private.vicelink_handle_new_user();

-- -----------------------------------------------------------------------------
-- RPC: atomic AI quota consumption (callable by the signed-in user only for
-- themselves; tier is read server-side from the protected profile row).
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_consume_ai_quota()
returns table (used integer, quota_limit integer, allowed boolean, tier text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_tier text;
  v_limit integer;
  v_used integer;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select p.access_tier into v_tier from public.vicelink_profiles p where p.user_id = v_uid;
  v_tier := coalesce(v_tier, 'free');
  v_limit := case when v_tier = 'kingpin' then null else 3 end;

  insert into public.vicelink_ai_usage (user_id, usage_date, count)
  values (v_uid, current_date, 0)
  on conflict (user_id, usage_date) do nothing;

  select u.count into v_used
  from public.vicelink_ai_usage u
  where u.user_id = v_uid and u.usage_date = current_date
  for update;

  if v_limit is not null and v_used >= v_limit then
    return query select v_used, v_limit, false, v_tier;
    return;
  end if;

  update public.vicelink_ai_usage u
     set count = u.count + 1
   where u.user_id = v_uid and u.usage_date = current_date
  returning u.count into v_used;

  return query select v_used, v_limit, true, v_tier;
end;
$$;

revoke execute on function public.vicelink_consume_ai_quota() from public, anon;
grant execute on function public.vicelink_consume_ai_quota() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- RPC: verified author tiers for the community board (handle + tier only).
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_author_tiers(p_user_ids uuid[])
returns table (user_id uuid, handle text, access_tier text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, p.handle, p.access_tier
  from public.vicelink_profiles p
  where (select auth.uid()) is not null
    and p.user_id = any (p_user_ids)
  limit 500;
$$;

revoke execute on function public.vicelink_author_tiers(uuid[]) from public, anon;
grant execute on function public.vicelink_author_tiers(uuid[]) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- RPC (service_role only): idempotently complete a payment and upgrade the
-- tier atomically. Never downgrades (kingpin stays kingpin).
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_complete_payment(
  p_provider text,
  p_provider_order_id text,
  p_user_id uuid,
  p_target_tier text,
  p_amount_usd numeric,
  p_raw_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier text;
  v_tx_user uuid;
  v_tx_tier text;
  v_tx_status text;
begin
  if p_target_tier not in ('street', 'kingpin') then
    raise exception 'VICELINK_INVALID_TIER' using errcode = '22023';
  end if;

  insert into public.vicelink_transactions
    (user_id, provider, provider_order_id, target_tier, amount_usd, currency, status, raw_payload)
  values
    (p_user_id, p_provider, p_provider_order_id, p_target_tier, p_amount_usd, 'USD', 'completed', p_raw_payload)
  on conflict (provider_order_id) do update
    set status = 'completed',
        raw_payload = excluded.raw_payload
    where public.vicelink_transactions.user_id = excluded.user_id
      and public.vicelink_transactions.provider = excluded.provider
      and public.vicelink_transactions.status <> 'refunded';

  -- The ledger row must belong to this user/tier and be completed, otherwise
  -- refuse to grant anything (mismatched or refunded order ids).
  select t.user_id, t.target_tier, t.status
    into v_tx_user, v_tx_tier, v_tx_status
  from public.vicelink_transactions t
  where t.provider_order_id = p_provider_order_id;

  if v_tx_user is distinct from p_user_id
     or v_tx_tier is distinct from p_target_tier
     or v_tx_status is distinct from 'completed' then
    raise exception 'VICELINK_TRANSACTION_MISMATCH' using errcode = '22023';
  end if;

  update public.vicelink_profiles p
     set access_tier = p_target_tier
   where p.user_id = p_user_id
     and private.vicelink_tier_rank(p.access_tier) < private.vicelink_tier_rank(p_target_tier);

  select p.access_tier into v_tier from public.vicelink_profiles p where p.user_id = p_user_id;
  return v_tier;
end;
$$;

revoke execute on function public.vicelink_complete_payment(text, text, uuid, text, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.vicelink_complete_payment(text, text, uuid, text, numeric, jsonb) to service_role;
