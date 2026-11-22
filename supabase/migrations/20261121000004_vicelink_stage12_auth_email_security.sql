-- =============================================================================
-- ViceLink Leonida Hub — Stage 12 Priority 0 Auth/2FA Lockout Fix,
-- Auth User Profile Backfill, Promo & Discount Codes, Law 81 Email Campaigns,
-- and 1-Click Unsubscribe Engine
--
-- IMPORTANT:
--   * 100% idempotent migration for shared Supabase project (bdtewmmtnfnbjwajmvdg).
--   * Only touches `vicelink_*` objects in `public` and `private` schemas,
--     plus targeted `auth.mfa_factors` demotion for orphaned pre-ViceLink factors
--     and `auth.users` -> `public.vicelink_profiles` / `public.vicelink_progress` backfill.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profile Columns for Law 81 Email Opt-In & 1-Click Unsubscribe Tokens
-- -----------------------------------------------------------------------------

alter table public.vicelink_profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists marketing_opt_in boolean not null default true,
  add column if not exists unsubscribe_token text not null default md5(random()::text || clock_timestamp()::text);

update public.vicelink_profiles
   set unsubscribe_token = md5(random()::text || user_id::text || clock_timestamp()::text)
 where coalesce(trim(unsubscribe_token), '') = '';

create index if not exists vicelink_profiles_marketing_opt_in_idx
  on public.vicelink_profiles (marketing_opt_in)
  where marketing_opt_in = true;

-- -----------------------------------------------------------------------------
-- 2. Priority 0 Fix 1.1: Demote Orphaned MFA Factors Where ViceLink MFA Is Off
-- -----------------------------------------------------------------------------

update auth.mfa_factors f
   set status = 'unverified',
       friendly_name = 'unverified_' || substr(f.id::text, 1, 8),
       updated_at = now()
 where not exists (
   select 1
   from public.vicelink_profiles p
   where p.user_id = f.user_id
     and p.mfa_enabled = true
 );

create or replace function public.vicelink_prepare_totp_enrollment()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_mfa_enabled boolean := false;
  v_count integer := 0;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select coalesce(p.mfa_enabled, false)
    into v_mfa_enabled
  from public.vicelink_profiles p
  where p.user_id = v_uid;

  if v_mfa_enabled = false then
    update auth.mfa_factors f
       set status = 'unverified',
           friendly_name = 'unverified_' || substr(f.id::text, 1, 8),
           updated_at = now()
     where f.user_id = v_uid;
    get diagnostics v_count = row_count;
  end if;

  return v_count;
end;
$$;

revoke execute on function public.vicelink_prepare_totp_enrollment() from public, anon;
grant execute on function public.vicelink_prepare_totp_enrollment() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. Priority 0 Fix 1.2: Auth Signup Trigger & Full Backfill from auth.users
-- -----------------------------------------------------------------------------

create or replace function private.vicelink_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := coalesce(trim(new.email), '');
  v_raw_handle text;
  v_clean_meta text;
  v_prefix text;
  v_handle text;
  v_display_name text;
  v_is_founder boolean := false;
  v_lang text := 'en';
begin
  v_is_founder := lower(v_email) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com');

  v_raw_handle := coalesce(
    nullif(trim(new.raw_user_meta_data->>'handle'), ''),
    nullif(trim(new.raw_user_meta_data->>'username'), '')
  );
  v_clean_meta := left(regexp_replace(coalesce(v_raw_handle, ''), '[^A-Za-z0-9_]', '', 'g'), 18);

  v_prefix := left(regexp_replace(split_part(lower(v_email), '@', 1), '[^A-Za-z0-9_]', '', 'g'), 14);
  if char_length(v_prefix) < 2 then
    v_prefix := 'agent';
  end if;

  if char_length(v_clean_meta) >= 2 then
    v_handle := '@' || v_clean_meta;
  else
    v_handle := '@' || v_prefix || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  v_display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      substr(v_handle, 2)
    ),
    60
  );

  if lower(coalesce(new.raw_user_meta_data->>'preferred_lang', '')) = 'es' then
    v_lang := 'es';
  end if;

  insert into public.vicelink_profiles (
    user_id,
    email,
    handle,
    display_name,
    access_tier,
    is_admin,
    preferred_lang,
    marketing_opt_in
  )
  values (
    new.id,
    v_email,
    v_handle,
    v_display_name,
    case when v_is_founder then 'kingpin' else 'free' end,
    v_is_founder,
    v_lang,
    true
  )
  on conflict (user_id) do update
    set email = case
          when coalesce(public.vicelink_profiles.email, '') = '' then excluded.email
          else public.vicelink_profiles.email
        end,
        is_admin = (public.vicelink_profiles.is_admin or excluded.is_admin),
        access_tier = case
          when excluded.is_admin then 'kingpin'
          else public.vicelink_profiles.access_tier
        end,
        is_banned = case
          when excluded.is_admin then false
          else public.vicelink_profiles.is_banned
        end;

  insert into public.vicelink_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.vicelink_handle_new_user() from public, anon, authenticated;

insert into public.vicelink_profiles (
  user_id,
  email,
  handle,
  display_name,
  access_tier,
  is_admin,
  preferred_lang,
  marketing_opt_in
)
select
  u.id,
  coalesce(trim(u.email), ''),
  '@' || coalesce(
    nullif(left(regexp_replace(split_part(lower(coalesce(u.email, '')), '@', 1), '[^a-zA-Z0-9_]', '', 'g'), 14), ''),
    'agent'
  ) || '_' || substr(replace(u.id::text, '-', ''), 1, 4),
  left(
    coalesce(
      nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'name'), ''),
      nullif(left(regexp_replace(split_part(lower(coalesce(u.email, '')), '@', 1), '[^a-zA-Z0-9_]', '', 'g'), 18), ''),
      'Agent'
    ),
    60
  ),
  case
    when lower(trim(coalesce(u.email, ''))) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com') then 'kingpin'
    else 'free'
  end,
  lower(trim(coalesce(u.email, ''))) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com'),
  'en',
  true
from auth.users u
on conflict (user_id) do update
  set email = case
        when coalesce(public.vicelink_profiles.email, '') = '' then excluded.email
        else public.vicelink_profiles.email
      end,
      is_admin = case
        when lower(trim(coalesce(excluded.email, ''))) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com') then true
        else public.vicelink_profiles.is_admin
      end,
      access_tier = case
        when lower(trim(coalesce(excluded.email, ''))) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com') then 'kingpin'
        else public.vicelink_profiles.access_tier
      end,
      is_banned = case
        when lower(trim(coalesce(excluded.email, ''))) in ('mikehevi2003@gmail.com', 'felipedleon@gmail.com') then false
        else public.vicelink_profiles.is_banned
      end;

insert into public.vicelink_progress (user_id)
select u.id
from auth.users u
on conflict (user_id) do nothing;

-- -----------------------------------------------------------------------------
-- 4. Promo & Discount Codes Table (`public.vicelink_promo_codes`)
-- -----------------------------------------------------------------------------

create table if not exists public.vicelink_promo_codes (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,24}$'),
  discount_pct integer not null check (discount_pct between 1 and 100),
  target_tier text not null default 'both' check (target_tier in ('street', 'kingpin', 'both')),
  max_uses integer not null default 100 check (max_uses >= 1),
  uses_count integer not null default 0 check (uses_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists vicelink_promo_codes_active_idx
  on public.vicelink_promo_codes (active, created_at desc);

alter table public.vicelink_promo_codes enable row level security;
alter table public.vicelink_promo_codes force row level security;

revoke all on public.vicelink_promo_codes from anon, public, authenticated;
grant select, insert, update on public.vicelink_promo_codes to authenticated;
grant all on public.vicelink_promo_codes to service_role;

do $$
begin
  create policy vicelink_promo_codes_select_authed on public.vicelink_promo_codes
    for select to authenticated
    using ((select auth.uid()) is not null);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_promo_codes_insert_admin on public.vicelink_promo_codes
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
  create policy vicelink_promo_codes_update_admin on public.vicelink_promo_codes
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

insert into public.vicelink_promo_codes (code, discount_pct, target_tier, max_uses, active, created_by)
values
  ('PANAMA50', 50, 'both', 500, true, 'system'),
  ('LEONIDA25', 25, 'both', 1000, true, 'system'),
  ('FOUNDERVIP', 100, 'kingpin', 25, true, 'system')
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- 5. Promo Redemptions Table (`public.vicelink_promo_redemptions`)
-- -----------------------------------------------------------------------------

create table if not exists public.vicelink_promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.vicelink_promo_codes(code),
  user_id uuid not null references public.vicelink_profiles(user_id),
  applied_tier text not null check (applied_tier in ('street', 'kingpin')),
  discount_pct integer not null check (discount_pct between 1 and 100),
  created_at timestamptz not null default now(),
  unique (code, user_id)
);

create index if not exists vicelink_promo_redemptions_user_id_idx
  on public.vicelink_promo_redemptions (user_id);

create index if not exists vicelink_promo_redemptions_code_idx
  on public.vicelink_promo_redemptions (code);

alter table public.vicelink_promo_redemptions enable row level security;
alter table public.vicelink_promo_redemptions force row level security;

revoke all on public.vicelink_promo_redemptions from anon, public, authenticated;
grant select on public.vicelink_promo_redemptions to authenticated;
grant all on public.vicelink_promo_redemptions to service_role;

do $$
begin
  create policy vicelink_promo_redemptions_select_own_or_admin on public.vicelink_promo_redemptions
    for select to authenticated
    using (
      (select auth.uid()) = user_id
      or exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Promotional Email Campaigns Table (`public.vicelink_email_campaigns`)
-- -----------------------------------------------------------------------------

create table if not exists public.vicelink_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.vicelink_profiles(user_id),
  admin_email text not null,
  audience text not null check (audience in ('all_opted_in', 'free_only', 'street_only')),
  subject_en text not null,
  subject_es text not null,
  body_en text not null,
  body_es text not null,
  promo_code text not null default '',
  recipients_count integer not null default 0 check (recipients_count >= 0),
  delivered_count integer not null default 0 check (delivered_count >= 0),
  delivery_mode text not null default 'dry_run_logged' check (delivery_mode in ('resend_live', 'dry_run_logged')),
  created_at timestamptz not null default now()
);

create index if not exists vicelink_email_campaigns_created_at_idx
  on public.vicelink_email_campaigns (created_at desc);

create index if not exists vicelink_email_campaigns_admin_id_idx
  on public.vicelink_email_campaigns (admin_id);

alter table public.vicelink_email_campaigns enable row level security;
alter table public.vicelink_email_campaigns force row level security;

revoke all on public.vicelink_email_campaigns from anon, public, authenticated;
grant select, insert on public.vicelink_email_campaigns to authenticated;
grant all on public.vicelink_email_campaigns to service_role;

do $$
begin
  create policy vicelink_email_campaigns_select_admin on public.vicelink_email_campaigns
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
  create policy vicelink_email_campaigns_insert_admin on public.vicelink_email_campaigns
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
-- 7. RPC: Validate / Redeem Promo Code (`public.vicelink_redeem_promo_code`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_redeem_promo_code(
  p_code text,
  p_target_tier text default 'kingpin'
)
returns table (
  valid boolean,
  code text,
  discount_pct integer,
  target_tier text,
  instant_unlock boolean,
  unlocked_tier text,
  error_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_code text := upper(trim(coalesce(p_code, '')));
  v_req_tier text := case when p_target_tier in ('street', 'kingpin') then p_target_tier else 'kingpin' end;
  v_promo public.vicelink_promo_codes%rowtype;
  v_unlock_tier text;
  v_final_tier text;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  if v_code !~ '^[A-Z0-9_-]{3,24}$' then
    return query select false, v_code, 0, 'both'::text, false, null::text, 'INVALID_CODE'::text;
    return;
  end if;

  select *
    into v_promo
  from public.vicelink_promo_codes c
  where c.code = v_code
  for update;

  if not found or v_promo.active = false then
    return query select false, v_code, 0, 'both'::text, false, null::text, 'INVALID_CODE'::text;
    return;
  end if;

  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    return query select false, v_promo.code, 0, v_promo.target_tier, false, null::text, 'CODE_EXPIRED'::text;
    return;
  end if;

  if v_promo.uses_count >= v_promo.max_uses then
    return query select false, v_promo.code, 0, v_promo.target_tier, false, null::text, 'MAX_USES_REACHED'::text;
    return;
  end if;

  if v_promo.discount_pct < 100
     and p_target_tier in ('street', 'kingpin')
     and v_promo.target_tier <> 'both'
     and v_promo.target_tier <> p_target_tier then
    return query select false, v_promo.code, 0, v_promo.target_tier, false, null::text, 'TIER_MISMATCH'::text;
    return;
  end if;

  if exists (
    select 1
    from public.vicelink_promo_redemptions r
    where r.code = v_promo.code
      and r.user_id = v_uid
  ) then
    return query select false, v_promo.code, 0, v_promo.target_tier, false, null::text, 'ALREADY_REDEEMED'::text;
    return;
  end if;

  if v_promo.discount_pct = 100 then
    v_unlock_tier := case
      when v_promo.target_tier = 'street' then 'street'
      when v_promo.target_tier = 'kingpin' then 'kingpin'
      else v_req_tier
    end;

    update public.vicelink_promo_codes c
       set uses_count = c.uses_count + 1
     where c.code = v_promo.code;

    insert into public.vicelink_promo_redemptions (code, user_id, applied_tier, discount_pct)
    values (v_promo.code, v_uid, v_unlock_tier, 100)
    on conflict (code, user_id) do nothing;

    perform set_config('vicelink.admin_grant', 'on', true);

    update public.vicelink_profiles p
       set access_tier = case
             when private.vicelink_tier_rank(p.access_tier) < private.vicelink_tier_rank(v_unlock_tier)
               then v_unlock_tier
             else p.access_tier
           end
     where p.user_id = v_uid
    returning p.access_tier into v_final_tier;

    perform set_config('vicelink.admin_grant', 'off', true);

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
      v_uid,
      'stripe',
      'PROMO-' || v_promo.code || '-' || substr(replace(v_uid::text, '-', ''), 1, 8) || '-' || extract(epoch from now())::bigint::text,
      v_unlock_tier,
      0.00,
      'USD',
      'completed',
      jsonb_build_object(
        'promoCode', v_promo.code,
        'discountPct', 100,
        'instantUnlock', true
      )
    )
    on conflict (provider_order_id) do nothing;

    return query select true, v_promo.code, 100, v_promo.target_tier, true, coalesce(v_final_tier, v_unlock_tier), ''::text;
    return;
  end if;

  return query select true, v_promo.code, v_promo.discount_pct, v_promo.target_tier, false, null::text, ''::text;
end;
$$;

revoke execute on function public.vicelink_redeem_promo_code(text, text) from public, anon;
grant execute on function public.vicelink_redeem_promo_code(text, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 8. RPC: Law 81 Email Unsubscribe (`public.vicelink_unsubscribe_email`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_unsubscribe_email(
  p_uid uuid,
  p_token text default ''
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_is_service boolean := (
    coalesce(auth.jwt()->>'role', '') = 'service_role'
    or current_user in ('service_role', 'postgres', 'supabase_admin')
    or session_user in ('service_role', 'postgres', 'supabase_admin')
  );
  v_clean_token text := trim(coalesce(p_token, ''));
  v_updated uuid;
begin
  if p_uid is null then
    return false;
  end if;

  if not v_is_service and v_caller is distinct from p_uid and v_clean_token = '' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.vicelink_profiles p
     set marketing_opt_in = false
   where p.user_id = p_uid
     and (v_clean_token = '' or p.unsubscribe_token = v_clean_token)
     and (v_is_service or v_caller = p_uid or v_clean_token <> '')
  returning p.user_id into v_updated;

  return v_updated is not null;
end;
$$;

revoke execute on function public.vicelink_unsubscribe_email(uuid, text) from public, anon;
grant execute on function public.vicelink_unsubscribe_email(uuid, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 9. RPC: Admin Campaign Recipients (`public.vicelink_admin_campaign_recipients`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_admin_campaign_recipients(
  p_audience text,
  p_test_email text default ''
)
returns table (
  user_id uuid,
  email text,
  handle text,
  preferred_lang text,
  unsubscribe_token text,
  access_tier text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_test text := lower(trim(coalesce(p_test_email, '')));
begin
  if coalesce(auth.jwt()->>'role', '') <> 'service_role'
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not exists (
       select 1 from public.vicelink_profiles p
       where p.user_id = (select auth.uid()) and p.is_admin = true
     ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if v_test <> '' then
    return query
    select
      p.user_id,
      p.email,
      p.handle,
      p.preferred_lang,
      p.unsubscribe_token,
      p.access_tier
    from public.vicelink_profiles p
    where lower(trim(p.email)) = v_test
      and p.is_banned = false
    limit 5;
    return;
  end if;

  return query
  select
    p.user_id,
    p.email,
    p.handle,
    p.preferred_lang,
    p.unsubscribe_token,
    p.access_tier
  from public.vicelink_profiles p
  where p.is_banned = false
    and p.marketing_opt_in = true
    and coalesce(trim(p.email), '') <> ''
    and (
      (p_audience = 'free_only' and p.access_tier = 'free')
      or (p_audience = 'street_only' and p.access_tier = 'street')
      or (p_audience not in ('free_only', 'street_only'))
    )
  order by p.created_at desc
  limit 1000;
end;
$$;

revoke execute on function public.vicelink_admin_campaign_recipients(text, text) from public, anon;
grant execute on function public.vicelink_admin_campaign_recipients(text, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 10. RPC: Admin User List v3 (`public.vicelink_admin_list_users_v3`)
-- -----------------------------------------------------------------------------

create or replace function public.vicelink_admin_list_users_v3(p_query text default '')
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
  is_banned boolean,
  marketing_opt_in boolean
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
    p.is_banned,
    p.marketing_opt_in
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

revoke execute on function public.vicelink_admin_list_users_v3(text) from public, anon;
grant execute on function public.vicelink_admin_list_users_v3(text) to authenticated, service_role;
