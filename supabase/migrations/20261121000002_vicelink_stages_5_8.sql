-- =============================================================================
-- ViceLink Leonida Hub — Stages 5–8 RBAC, Dynamic CMS & Community Submissions
--
-- IMPORTANT:
--   * MCP-safe & 100% idempotent: NEVER uses DROP statements.
--   * Shared Supabase project (bdtewmmtnfnbjwajmvdg): NEVER touches non-ViceLink
--     tables; every object is prefixed with `vicelink_`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Column extensions on existing ViceLink tables
-- -----------------------------------------------------------------------------

alter table public.vicelink_profiles
  add column if not exists is_admin boolean not null default false;

alter table public.vicelink_progress
  add column if not exists unlocked_trophies text[] not null default '{}';

create index if not exists vicelink_profiles_is_admin_idx
  on public.vicelink_profiles (user_id)
  where is_admin = true;

-- -----------------------------------------------------------------------------
-- 2. Harden profile guard trigger for is_admin + transaction-local admin grants
-- -----------------------------------------------------------------------------

create or replace function private.vicelink_guard_profile_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Self-service inserts (e.g. missing-profile recovery) always start free & non-admin.
    if coalesce(auth.jwt()->>'role', '') <> 'service_role'
       and current_user not in ('service_role', 'postgres', 'supabase_admin') then
      new.access_tier := 'free';
      new.is_admin := false;
      new.stripe_customer_id := null;
    end if;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- End users and non-privileged callers can never modify is_admin or stripe_customer_id.
  if (new.is_admin is distinct from old.is_admin
      or new.stripe_customer_id is distinct from old.stripe_customer_id)
     and coalesce(auth.jwt()->>'role', '') <> 'service_role'
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'VICELINK_PRIVILEGE_PROTECTED: is_admin and stripe_customer_id are restricted'
      using errcode = '42501';
  end if;

  -- Block changing access_tier unless privileged or inside vicelink_admin_grant_tier().
  if new.access_tier is distinct from old.access_tier
     and coalesce(auth.jwt()->>'role', '') <> 'service_role'
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and coalesce(current_setting('vicelink.admin_grant', true), '') <> 'on' then
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

-- -----------------------------------------------------------------------------
-- 3. Dynamic CMS & Community Submissions tables (Stages 5–8)
-- -----------------------------------------------------------------------------

create table if not exists public.vicelink_dynamic_cheats (
  id text primary key,
  title_en text not null,
  title_es text not null,
  category text not null check (category in ('Player', 'Combat', 'Vehicles', 'World')),
  unlock_en text not null default '',
  unlock_es text not null default '',
  how_to_unlock_en text not null default '',
  how_to_unlock_es text not null default '',
  desc_en text not null default '',
  desc_es text not null default '',
  button_sequence jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.vicelink_dynamic_glitches (
  id text primary key,
  category text not null check (category in ('Money', 'Camera', 'Stealth', 'Physics')),
  patch_status text not null default 'WORKING ON PATCH 01.002.001',
  is_patched boolean not null default false,
  title_en text not null,
  title_es text not null,
  steps_en jsonb not null default '[]'::jsonb,
  steps_es jsonb not null default '[]'::jsonb,
  warning_en text not null default '',
  warning_es text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.vicelink_dynamic_map_pins (
  id text primary key,
  tier text not null default 'street' check (tier in ('free', 'street', 'kingpin')),
  pin_type text not null check (pin_type in ('Money', 'ATM', 'RareCar', 'Fence', 'EasterEgg', 'Collectible')),
  region text not null,
  icon text not null,
  coord_x numeric(5,2) not null check (coord_x >= 0 and coord_x <= 100),
  coord_y numeric(5,2) not null check (coord_y >= 0 and coord_y <= 100),
  name_en text not null,
  name_es text not null,
  note_en text not null default '',
  note_es text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.vicelink_community_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.vicelink_profiles(user_id) on delete set null,
  author_handle text not null,
  submission_type text not null check (
    submission_type in ('money_spot', 'glitch_report', 'easter_egg', 'cheat_combo', 'site_feedback')
  ),
  region_or_category text not null default '' check (char_length(region_or_category) <= 80),
  title text not null check (char_length(title) between 2 and 140),
  details text not null check (char_length(details) between 5 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'implemented', 'rejected')),
  admin_notes text not null default '' check (char_length(admin_notes) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.vicelink_submission_votes (
  submission_id uuid not null references public.vicelink_community_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (submission_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 4. Indexes (user_id + lookup columns)
-- -----------------------------------------------------------------------------

create index if not exists vicelink_dynamic_cheats_category_idx
  on public.vicelink_dynamic_cheats (category);

create index if not exists vicelink_dynamic_glitches_category_idx
  on public.vicelink_dynamic_glitches (category);

create index if not exists vicelink_dynamic_glitches_patched_idx
  on public.vicelink_dynamic_glitches (is_patched);

create index if not exists vicelink_dynamic_map_pins_tier_idx
  on public.vicelink_dynamic_map_pins (tier);

create index if not exists vicelink_dynamic_map_pins_region_idx
  on public.vicelink_dynamic_map_pins (region);

create index if not exists vicelink_community_submissions_user_id_idx
  on public.vicelink_community_submissions (user_id);

create index if not exists vicelink_community_submissions_status_idx
  on public.vicelink_community_submissions (status, created_at desc);

create index if not exists vicelink_community_submissions_created_at_idx
  on public.vicelink_community_submissions (created_at desc);

create index if not exists vicelink_submission_votes_user_id_idx
  on public.vicelink_submission_votes (user_id);

create index if not exists vicelink_submission_votes_submission_id_idx
  on public.vicelink_submission_votes (submission_id);

-- -----------------------------------------------------------------------------
-- 5. Row Level Security + Privileges
-- -----------------------------------------------------------------------------

alter table public.vicelink_dynamic_cheats enable row level security;
alter table public.vicelink_dynamic_cheats force row level security;

alter table public.vicelink_dynamic_glitches enable row level security;
alter table public.vicelink_dynamic_glitches force row level security;

alter table public.vicelink_dynamic_map_pins enable row level security;
alter table public.vicelink_dynamic_map_pins force row level security;

alter table public.vicelink_community_submissions enable row level security;
alter table public.vicelink_community_submissions force row level security;

alter table public.vicelink_submission_votes enable row level security;
alter table public.vicelink_submission_votes force row level security;

revoke all on public.vicelink_dynamic_cheats from anon, public, authenticated;
revoke all on public.vicelink_dynamic_glitches from anon, public, authenticated;
revoke all on public.vicelink_dynamic_map_pins from anon, public, authenticated;
revoke all on public.vicelink_community_submissions from anon, public, authenticated;
revoke all on public.vicelink_submission_votes from anon, public, authenticated;

grant select, insert, update, delete on public.vicelink_dynamic_cheats to authenticated;
grant select, insert, update, delete on public.vicelink_dynamic_glitches to authenticated;
grant select, insert, update, delete on public.vicelink_dynamic_map_pins to authenticated;
grant select, insert, update, delete on public.vicelink_community_submissions to authenticated;
grant select, insert, delete on public.vicelink_submission_votes to authenticated;

grant all on public.vicelink_dynamic_cheats to service_role;
grant all on public.vicelink_dynamic_glitches to service_role;
grant all on public.vicelink_dynamic_map_pins to service_role;
grant all on public.vicelink_community_submissions to service_role;
grant all on public.vicelink_submission_votes to service_role;

-- -----------------------------------------------------------------------------
-- 6. Policies (idempotent without DROP)
-- -----------------------------------------------------------------------------

-- vicelink_dynamic_cheats: readable by authenticated, writable by admins only.
do $$
begin
  create policy vicelink_dynamic_cheats_select_all on public.vicelink_dynamic_cheats
    for select to authenticated
    using (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_cheats_insert_admin on public.vicelink_dynamic_cheats
    for insert to authenticated
    with check (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_cheats_update_admin on public.vicelink_dynamic_cheats
    for update to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    )
    with check (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_cheats_delete_admin on public.vicelink_dynamic_cheats
    for delete to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

-- vicelink_dynamic_glitches: readable by street+ or admins, writable by admins only.
do $$
begin
  create policy vicelink_dynamic_glitches_select_paid on public.vicelink_dynamic_glitches
    for select to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid())
          and (p.access_tier in ('street', 'kingpin') or p.is_admin = true)
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_glitches_insert_admin on public.vicelink_dynamic_glitches
    for insert to authenticated
    with check (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_glitches_update_admin on public.vicelink_dynamic_glitches
    for update to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    )
    with check (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_glitches_delete_admin on public.vicelink_dynamic_glitches
    for delete to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

-- vicelink_dynamic_map_pins: tier-gated reads for authenticated, writable by admins only.
do $$
begin
  create policy vicelink_dynamic_map_pins_select_tiered on public.vicelink_dynamic_map_pins
    for select to authenticated
    using (
      tier = 'free'
      or exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid())
          and (
            p.is_admin = true
            or p.access_tier = 'kingpin'
            or (p.access_tier = 'street' and tier in ('free', 'street'))
          )
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_map_pins_insert_admin on public.vicelink_dynamic_map_pins
    for insert to authenticated
    with check (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_map_pins_update_admin on public.vicelink_dynamic_map_pins
    for update to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    )
    with check (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_dynamic_map_pins_delete_admin on public.vicelink_dynamic_map_pins
    for delete to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

-- vicelink_community_submissions:
--   * authenticated users see approved/implemented + their own rows; admins see all.
--   * authenticated users can insert their own rows (trigger enforces status='pending').
--   * only admins can update/delete moderation fields.
do $$
begin
  create policy vicelink_community_submissions_select_visible on public.vicelink_community_submissions
    for select to authenticated
    using (
      status in ('approved', 'implemented')
      or (select auth.uid()) = user_id
      or exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_community_submissions_insert_own on public.vicelink_community_submissions
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_community_submissions_update_admin on public.vicelink_community_submissions
    for update to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    )
    with check (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_community_submissions_delete_admin on public.vicelink_community_submissions
    for delete to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

-- vicelink_submission_votes: readable on visible submissions, insert/delete own votes.
do $$
begin
  create policy vicelink_submission_votes_select_visible on public.vicelink_submission_votes
    for select to authenticated
    using (
      exists (
        select 1 from public.vicelink_community_submissions s
        where s.id = submission_id
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_submission_votes_insert_own on public.vicelink_submission_votes
    for insert to authenticated
    with check (
      (select auth.uid()) = user_id
      and exists (
        select 1 from public.vicelink_community_submissions s
        where s.id = submission_id
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_submission_votes_delete_own on public.vicelink_submission_votes
    for delete to authenticated
    using ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 7. Triggers (timestamps & community submission guard)
-- -----------------------------------------------------------------------------

do $$
begin
  create trigger vicelink_dynamic_cheats_touch
    before update on public.vicelink_dynamic_cheats
    for each row execute function private.vicelink_touch_updated_at();
exception when duplicate_object then null;
end $$;

do $$
begin
  create trigger vicelink_dynamic_glitches_touch
    before update on public.vicelink_dynamic_glitches
    for each row execute function private.vicelink_touch_updated_at();
exception when duplicate_object then null;
end $$;

create or replace function private.vicelink_guard_community_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_handle text;
  v_is_admin boolean := false;
begin
  select p.handle, p.is_admin
    into v_handle, v_is_admin
  from public.vicelink_profiles p
  where p.user_id = new.user_id;

  if v_handle is null then
    raise exception 'VICELINK_PROFILE_REQUIRED' using errcode = '23503';
  end if;

  new.author_handle := v_handle;

  if not coalesce(v_is_admin, false)
     and coalesce(auth.jwt()->>'role', '') <> 'service_role'
     and session_user not in ('service_role', 'postgres', 'supabase_admin') then
    new.status := 'pending';
    new.admin_notes := '';
  else
    new.status := coalesce(new.status, 'pending');
    new.admin_notes := coalesce(new.admin_notes, '');
  end if;

  new.created_at := now();
  return new;
end;
$$;

revoke execute on function private.vicelink_guard_community_submission() from public, anon, authenticated;

do $$
begin
  create trigger vicelink_community_submissions_guard
    before insert on public.vicelink_community_submissions
    for each row execute function private.vicelink_guard_community_submission();
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 8. Admin-only SECURITY DEFINER RPCs
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_admin_search_users(p_query text)
returns table (
  user_id uuid,
  email text,
  handle text,
  display_name text,
  access_tier text,
  is_admin boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_query text := coalesce(trim(p_query), '');
  v_escaped text;
begin
  if not exists (
    select 1 from public.vicelink_profiles p
    where p.user_id = (select auth.uid()) and p.is_admin = true
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  v_escaped := replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_');

  return query
  select
    p.user_id,
    p.email,
    p.handle,
    p.display_name,
    p.access_tier,
    p.is_admin,
    p.created_at
  from public.vicelink_profiles p
  where v_query = ''
     or p.email ilike ('%' || v_escaped || '%') escape '\'
     or p.handle ilike ('%' || v_escaped || '%') escape '\'
  order by p.created_at desc
  limit 50;
end;
$$;

revoke execute on function public.vicelink_admin_search_users(text) from public, anon;
grant execute on function public.vicelink_admin_search_users(text) to authenticated, service_role;

create or replace function public.vicelink_admin_grant_tier(
  p_target_user_id uuid,
  p_target_tier text,
  p_provider text default 'yappy',
  p_reference text default ''
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_order_id text;
  v_amount numeric(6,2);
begin
  if not exists (
    select 1 from public.vicelink_profiles p
    where p.user_id = (select auth.uid()) and p.is_admin = true
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_target_tier not in ('free', 'street', 'kingpin') then
    raise exception 'VICELINK_INVALID_TIER' using errcode = '22023';
  end if;

  if p_provider not in ('yappy', 'tilopay', 'paguelofacil', 'stripe') then
    raise exception 'VICELINK_INVALID_PROVIDER' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.vicelink_profiles p
    where p.user_id = p_target_user_id
  ) then
    raise exception 'VICELINK_USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  perform set_config('vicelink.admin_grant', 'on', true);

  update public.vicelink_profiles p
     set access_tier = p_target_tier
   where p.user_id = p_target_user_id;

  perform set_config('vicelink.admin_grant', 'off', true);

  if p_target_tier in ('street', 'kingpin') then
    v_amount := case when p_target_tier = 'kingpin' then 4.99 else 1.99 end;
    v_order_id := 'ADM' || to_char(clock_timestamp(), 'YYMMDDHH24MISSMS')
                  || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    insert into public.vicelink_transactions (
      user_id,
      provider,
      provider_order_id,
      target_tier,
      amount_usd,
      currency,
      status,
      raw_payload
    )
    values (
      p_target_user_id,
      p_provider,
      v_order_id,
      p_target_tier,
      v_amount,
      'USD',
      'completed',
      jsonb_build_object(
        'manualAdminGrant', true,
        'grantedBy', v_admin_id,
        'reference', left(coalesce(trim(p_reference), ''), 200)
      )
    );
  end if;

  return p_target_tier;
end;
$$;

revoke execute on function public.vicelink_admin_grant_tier(uuid, text, text, text) from public, anon;
grant execute on function public.vicelink_admin_grant_tier(uuid, text, text, text) to authenticated, service_role;
