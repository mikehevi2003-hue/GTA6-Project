-- =============================================================================
-- ViceLink Leonida Hub — Stage 17 AI Patch & Update Intelligence +
-- Internal Web Keyword Search Analytics
--
-- Idempotent migration for shared Supabase project (bdtewmmtnfnbjwajmvdg).
-- Only touches `vicelink_*` tables.
-- =============================================================================

create table if not exists public.vicelink_patch_reports (
  id uuid primary key default gen_random_uuid(),
  patch_version text not null,
  source_url text not null default '',
  source_type text not null default 'manual_paste',
  raw_notes text not null,
  ai_summary_en text not null,
  ai_summary_es text not null,
  confidence_score integer not null check (confidence_score between 0 and 100),
  status text not null default 'draft' check (status in ('draft', 'auto_published', 'published', 'rolled_back', 'rejected')),
  proposed_changes jsonb not null default '[]'::jsonb,
  rollback_snapshot jsonb not null default '[]'::jsonb,
  applied_count integer not null default 0,
  created_by text not null,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  rolled_back_at timestamptz
);

create index if not exists idx_vicelink_patch_reports_created_at
  on public.vicelink_patch_reports (created_at desc);

create index if not exists idx_vicelink_patch_reports_status
  on public.vicelink_patch_reports (status);

alter table public.vicelink_patch_reports enable row level security;
alter table public.vicelink_patch_reports force row level security;

revoke all on public.vicelink_patch_reports from anon, public, authenticated;
grant select, insert, update on public.vicelink_patch_reports to authenticated;
grant all on public.vicelink_patch_reports to service_role;

do $$
begin
  create policy vicelink_patch_reports_admin_all on public.vicelink_patch_reports
    for all to authenticated
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

create table if not exists public.vicelink_keyword_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  area text not null,
  keyword text not null,
  result_count integer not null default 0,
  lang text not null default 'en',
  created_at timestamptz not null default now()
);

create index if not exists idx_vicelink_keyword_searches_created_at
  on public.vicelink_keyword_searches (created_at desc);

create index if not exists idx_vicelink_keyword_searches_area_keyword
  on public.vicelink_keyword_searches (area, keyword);

alter table public.vicelink_keyword_searches enable row level security;
alter table public.vicelink_keyword_searches force row level security;

revoke all on public.vicelink_keyword_searches from anon, public, authenticated;
grant select, insert on public.vicelink_keyword_searches to authenticated;
grant all on public.vicelink_keyword_searches to service_role;

do $$
begin
  create policy vicelink_keyword_searches_insert_own on public.vicelink_keyword_searches
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy vicelink_keyword_searches_select_admin on public.vicelink_keyword_searches
    for select to authenticated
    using (
      exists (
        select 1 from public.vicelink_profiles p
        where p.user_id = (select auth.uid()) and p.is_admin = true
      )
    );
exception when duplicate_object then null;
end $$;
