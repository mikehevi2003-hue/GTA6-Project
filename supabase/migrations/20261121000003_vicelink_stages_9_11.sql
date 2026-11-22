-- =============================================================================
-- ViceLink Leonida Hub — Stages 9–11 Account Security, Console Verification,
-- Smart Progress Sync, Site Settings, Telemetry & Immutable Admin Audit Logs
--
-- IMPORTANT:
--   * 100% idempotent migration for shared Supabase project (bdtewmmtnfnbjwajmvdg).
--   * Only touches `vicelink_*` objects.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profile Columns for Stage 9 Identity, Console Verification, 2FA & Moderation
-- -----------------------------------------------------------------------------

alter table public.vicelink_profiles
  add column if not exists avatar_preset text not null default 'neon_vice',
  add column if not exists psn_id text not null default '',
  add column if not exists psn_verified boolean not null default false,
  add column if not exists xbox_gamertag text not null default '',
  add column if not exists xbox_verified boolean not null default false,
  add column if not exists social_club_handle text not null default '',
  add column if not exists verification_code text not null default ('VL-' || upper(substr(md5(random()::text), 1, 6))),
  add column if not exists mfa_enabled boolean not null default false,
  add column if not exists is_banned boolean not null default false;

update public.vicelink_profiles
   set verification_code = 'VL-' || upper(substr(md5(random()::text || user_id::text), 1, 6))
 where coalesce(trim(verification_code), '') = '';

create index if not exists vicelink_profiles_psn_id_idx
  on public.vicelink_profiles (psn_id)
  where psn_id <> '';

create index if not exists vicelink_profiles_xbox_gamertag_idx
  on public.vicelink_profiles (xbox_gamertag)
  where xbox_gamertag <> '';

create index if not exists vicelink_profiles_email_lower_idx
  on public.vicelink_profiles (lower(email));

-- -----------------------------------------------------------------------------
-- 2. Harden Profile Guard Trigger & Elevate Co-Founders
-- -----------------------------------------------------------------------------

create or replace function private.vicelink_guard_profile_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_is_privileged boolean := (
    coalesce(auth.jwt()->>'role', '') = 'service_role'
    or current_user in ('service_role', 'postgres', 'supabase_admin')
    or session_user in ('service_role', 'postgres', 'supabase_admin')
  );
  v_is_cofounder boolean := false;
begin
  if tg_op = 'INSERT' then
    v_is_cofounder := lower(coalesce(new.email, '')) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com');
    if v_is_cofounder then
      new.is_admin := true;
      new.access_tier := 'kingpin';
      new.is_banned := false;
    elsif not v_is_privileged then
      new.access_tier := 'free';
      new.is_admin := false;
      new.stripe_customer_id := null;
      new.is_banned := false;
      new.psn_verified := false;
      new.xbox_verified := false;
    end if;

    new.verification_code := coalesce(
      nullif(trim(new.verification_code), ''),
      'VL-' || upper(substr(md5(random()::text), 1, 6))
    );
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  if not v_is_privileged then
    new.email := old.email;
  end if;

  v_is_cofounder := lower(coalesce(new.email, '')) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com');

  if not v_is_privileged then
    if not v_is_cofounder and new.is_admin is distinct from old.is_admin then
      raise exception 'VICELINK_PRIVILEGE_PROTECTED: is_admin is restricted'
        using errcode = '42501';
    end if;

    if new.stripe_customer_id is distinct from old.stripe_customer_id then
      raise exception 'VICELINK_PRIVILEGE_PROTECTED: stripe_customer_id is restricted'
        using errcode = '42501';
    end if;

    if new.verification_code is distinct from old.verification_code then
      raise exception 'VICELINK_PRIVILEGE_PROTECTED: verification_code is restricted'
        using errcode = '42501';
    end if;

    if new.is_banned is distinct from old.is_banned
       and coalesce(current_setting('vicelink.admin_ban', true), '') <> 'on' then
      raise exception 'VICELINK_BAN_PROTECTED: is_banned is managed by administrators'
        using errcode = '42501';
    end if;

    if ((new.psn_verified = true and old.psn_verified = false)
        or (new.xbox_verified = true and old.xbox_verified = false))
       and coalesce(current_setting('vicelink.console_verify', true), '') <> 'on' then
      raise exception 'VICELINK_CONSOLE_VERIFY_PROTECTED: console verification requires bio-code handshake'
        using errcode = '42501';
    end if;

    if not v_is_cofounder
       and new.access_tier is distinct from old.access_tier
       and coalesce(current_setting('vicelink.admin_grant', true), '') <> 'on' then
      raise exception 'VICELINK_TIER_PROTECTED: access_tier is managed by the payment server'
        using errcode = '42501';
    end if;
  end if;

  if v_is_cofounder then
    new.is_admin := true;
    new.access_tier := 'kingpin';
    new.is_banned := false;
  end if;

  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.vicelink_guard_profile_tier() from public, anon, authenticated;

update public.vicelink_profiles
   set is_admin = true,
       access_tier = 'kingpin',
       is_banned = false
 where lower(email) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com');

-- -----------------------------------------------------------------------------
-- 3. Immutable Admin Audit Logs Table (`public.vicelink_admin_audit_logs`)
-- -----------------------------------------------------------------------------

create table if not exists public.vicelink_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  admin_email text not null,
  action_type text not null,
  target_id text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vicelink_admin_audit_logs_created_at_idx
  on public.vicelink_admin_audit_logs (created_at desc);

create index if not exists vicelink_admin_audit_logs_admin_id_idx
  on public.vicelink_admin_audit_logs (admin_id);

alter table public.vicelink_admin_audit_logs enable row level security;
alter table public.vicelink_admin_audit_logs force row level security;

revoke all on public.vicelink_admin_audit_logs from anon, public, authenticated;
grant select, insert on public.vicelink_admin_audit_logs to authenticated;
grant all on public.vicelink_admin_audit_logs to service_role;

do $$
begin
  create policy vicelink_admin_audit_logs_select_admin on public.vicelink_admin_audit_logs
    for select to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_admin_audit_logs_insert_admin on public.vicelink_admin_audit_logs
    for insert to authenticated
    with check (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Live Site Settings Table (`public.vicelink_site_settings`)
-- -----------------------------------------------------------------------------

create table if not exists public.vicelink_site_settings (
  key text primary key,
  value jsonb not null,
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.vicelink_site_settings enable row level security;
alter table public.vicelink_site_settings force row level security;

revoke all on public.vicelink_site_settings from anon, public, authenticated;
grant select, insert, update on public.vicelink_site_settings to authenticated;
grant all on public.vicelink_site_settings to service_role;

do $$
begin
  create policy vicelink_site_settings_select_authed on public.vicelink_site_settings
    for select to authenticated
    using ((select auth.uid()) is not null);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_site_settings_insert_admin on public.vicelink_site_settings
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
  create policy vicelink_site_settings_update_admin on public.vicelink_site_settings
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

insert into public.vicelink_site_settings (key, value, updated_by)
values
  (
    'global_banner',
    '{"active": true, "textEn": "ViceLink v2.5 Patch Live — 19 Verified Cheats & 32 Tactical Pins Active", "textEs": "ViceLink v2.5 en Vivo — 19 Trucos Verificados y 32 Pines Tácticos Activos"}'::jsonb,
    'system'
  ),
  (
    'free_ai_daily_limit',
    '{"limit": 3}'::jsonb,
    'system'
  ),
  (
    'maintenance_mode',
    '{"enabled": false}'::jsonb,
    'system'
  ),
  (
    'glitches_tab_enabled',
    '{"enabled": true}'::jsonb,
    'system'
  )
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- 5. Dynamic AI Quota RPC (`public.vicelink_consume_ai_quota()`)
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
  v_cfg_limit integer;
  v_limit integer;
  v_used integer;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select p.access_tier into v_tier
  from public.vicelink_profiles p
  where p.user_id = v_uid;

  v_tier := coalesce(v_tier, 'free');

  if v_tier = 'kingpin' then
    v_limit := null;
  else
    select (s.value->>'limit')::integer
      into v_cfg_limit
    from public.vicelink_site_settings s
    where s.key = 'free_ai_daily_limit';

    v_limit := least(greatest(coalesce(v_cfg_limit, 3), 1), 50);
  end if;

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
-- 6. Author Console Badges & Avatars RPC (`public.vicelink_author_badges`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_author_badges(p_user_ids uuid[])
returns table (
  user_id uuid,
  handle text,
  access_tier text,
  avatar_preset text,
  psn_verified boolean,
  xbox_verified boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.user_id,
    p.handle,
    p.access_tier,
    p.avatar_preset,
    p.psn_verified,
    p.xbox_verified
  from public.vicelink_profiles p
  where (select auth.uid()) is not null
    and p.user_id = any (p_user_ids)
  limit 500;
$$;

revoke execute on function public.vicelink_author_badges(uuid[]) from public, anon;
grant execute on function public.vicelink_author_badges(uuid[]) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 7. Console Handle Verification RPC (`public.vicelink_verify_console_handle`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_verify_console_handle(
  p_platform text,
  p_handle text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_clean text := trim(coalesce(p_handle, ''));
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  if p_platform not in ('psn', 'xbox', 'social_club') then
    raise exception 'VICELINK_INVALID_PLATFORM' using errcode = '22023';
  end if;

  if v_clean !~ '^[A-Za-z0-9 _-]{3,24}$' then
    raise exception 'VICELINK_INVALID_CONSOLE_HANDLE' using errcode = '22023';
  end if;

  perform set_config('vicelink.console_verify', 'on', true);

  if p_platform = 'psn' then
    update public.vicelink_profiles
       set psn_id = v_clean,
           psn_verified = true
     where user_id = v_uid;
  elsif p_platform = 'xbox' then
    update public.vicelink_profiles
       set xbox_gamertag = v_clean,
           xbox_verified = true
     where user_id = v_uid;
  elsif p_platform = 'social_club' then
    update public.vicelink_profiles
       set social_club_handle = v_clean
     where user_id = v_uid;
  end if;

  perform set_config('vicelink.console_verify', 'off', true);
  return true;
end;
$$;

revoke execute on function public.vicelink_verify_console_handle(text, text) from public, anon;
grant execute on function public.vicelink_verify_console_handle(text, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 8. Admin User Search v2 (`public.vicelink_admin_list_users_v2`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_admin_list_users_v2(p_query text default '')
returns table (
  user_id uuid,
  email text,
  handle text,
  display_name text,
  access_tier text,
  is_admin boolean,
  created_at timestamptz,
  avatar_preset text,
  psn_id text,
  psn_verified boolean,
  xbox_gamertag text,
  xbox_verified boolean,
  mfa_enabled boolean,
  is_banned boolean
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
    p.created_at,
    p.avatar_preset,
    p.psn_id,
    p.psn_verified,
    p.xbox_gamertag,
    p.xbox_verified,
    p.mfa_enabled,
    p.is_banned
  from public.vicelink_profiles p
  where v_query = ''
     or p.email ilike ('%' || v_escaped || '%') escape '\'
     or p.handle ilike ('%' || v_escaped || '%') escape '\'
     or p.display_name ilike ('%' || v_escaped || '%') escape '\'
     or p.psn_id ilike ('%' || v_escaped || '%') escape '\'
     or p.xbox_gamertag ilike ('%' || v_escaped || '%') escape '\'
  order by p.created_at desc
  limit 100;
end;
$$;

revoke execute on function public.vicelink_admin_list_users_v2(text) from public, anon;
grant execute on function public.vicelink_admin_list_users_v2(text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 9. Admin KPI Telemetry RPC (`public.vicelink_admin_telemetry`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_admin_telemetry()
returns table (
  gross_revenue_usd numeric,
  yappy_revenue_usd numeric,
  card_revenue_usd numeric,
  total_users integer,
  free_users integer,
  street_users integer,
  kingpin_users integer,
  conversion_rate_pct numeric,
  linked_console_users integer,
  ai_calls_today integer,
  mfa_enabled_users integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_gross numeric := 0;
  v_yappy numeric := 0;
  v_card numeric := 0;
  v_total integer := 0;
  v_free integer := 0;
  v_street integer := 0;
  v_kingpin integer := 0;
  v_conv numeric := 0;
  v_linked integer := 0;
  v_ai_today integer := 0;
  v_mfa integer := 0;
begin
  if not exists (
    select 1 from public.vicelink_profiles p
    where p.user_id = (select auth.uid()) and p.is_admin = true
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select
    coalesce(sum(t.amount_usd), 0),
    coalesce(sum(t.amount_usd) filter (where t.provider = 'yappy'), 0),
    coalesce(sum(t.amount_usd) filter (where t.provider in ('stripe', 'tilopay', 'paguelofacil')), 0)
  into v_gross, v_yappy, v_card
  from public.vicelink_transactions t
  where t.status = 'completed';

  select
    count(*)::integer,
    count(*) filter (where p.access_tier = 'free')::integer,
    count(*) filter (where p.access_tier = 'street')::integer,
    count(*) filter (where p.access_tier = 'kingpin')::integer,
    count(*) filter (
      where p.psn_id <> ''
         or p.xbox_gamertag <> ''
         or p.social_club_handle <> ''
         or p.psn_verified = true
         or p.xbox_verified = true
    )::integer,
    count(*) filter (where p.mfa_enabled = true)::integer
  into v_total, v_free, v_street, v_kingpin, v_linked, v_mfa
  from public.vicelink_profiles p;

  if v_total > 0 then
    v_conv := round(((v_street + v_kingpin)::numeric / v_total::numeric) * 100, 1);
  else
    v_conv := 0;
  end if;

  select coalesce(sum(u.count), 0)::integer
    into v_ai_today
  from public.vicelink_ai_usage u
  where u.usage_date = current_date;

  return query
  select
    v_gross,
    v_yappy,
    v_card,
    v_total,
    v_free,
    v_street,
    v_kingpin,
    v_conv,
    v_linked,
    v_ai_today,
    v_mfa;
end;
$$;

revoke execute on function public.vicelink_admin_telemetry() from public, anon;
grant execute on function public.vicelink_admin_telemetry() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 10. Admin Ban / Unban Toggle RPC (`public.vicelink_admin_toggle_ban`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_admin_toggle_ban(
  p_target_user_id uuid,
  p_is_banned boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_result boolean;
begin
  if not exists (
    select 1 from public.vicelink_profiles p
    where p.user_id = (select auth.uid()) and p.is_admin = true
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select lower(p.email) into v_email
  from public.vicelink_profiles p
  where p.user_id = p_target_user_id;

  if v_email is null then
    raise exception 'VICELINK_USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_email in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com') and p_is_banned = true then
    raise exception 'VICELINK_COFOUNDER_PROTECTED: Co-founder accounts cannot be banned'
      using errcode = '42501';
  end if;

  perform set_config('vicelink.admin_ban', 'on', true);

  update public.vicelink_profiles p
     set is_banned = coalesce(p_is_banned, false)
   where p.user_id = p_target_user_id
  returning p.is_banned into v_result;

  perform set_config('vicelink.admin_ban', 'off', true);
  return coalesce(v_result, false);
end;
$$;

revoke execute on function public.vicelink_admin_toggle_ban(uuid, boolean) from public, anon;
grant execute on function public.vicelink_admin_toggle_ban(uuid, boolean) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 11. Admin Comment Moderation RPC (`public.vicelink_admin_redact_comment`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_admin_redact_comment(
  p_comment_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated uuid;
begin
  if not exists (
    select 1 from public.vicelink_profiles p
    where p.user_id = (select auth.uid()) and p.is_admin = true
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.vicelink_comments c
     set body = '[Removed by ViceLink Moderator]',
         gif_id = ''
   where c.id = p_comment_id
  returning c.id into v_updated;

  if v_updated is null then
    raise exception 'VICELINK_COMMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

revoke execute on function public.vicelink_admin_redact_comment(uuid) from public, anon;
grant execute on function public.vicelink_admin_redact_comment(uuid) to authenticated, service_role;
