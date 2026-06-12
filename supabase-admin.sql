-- =====================================================================
-- ADMIN ACCESS — run AFTER supabase-schema.sql (and the migration).
-- Lets ONLY the emails you list manage content + read submissions.
-- Supabase → SQL Editor → paste → Run.
-- =====================================================================

-- 1) Who is an admin
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

-- 👇 CHANGE THIS to the email you will log in with, then it's locked down.
insert into public.admins (email) values ('koredebusuyi.career@gmail.com')
on conflict do nothing;

-- An authenticated user may check the admins list (needed by the app).
drop policy if exists "admins readable by authenticated" on public.admins;
create policy "admins readable by authenticated"
  on public.admins for select to authenticated using (true);

-- 2) Admin can fully manage videos
drop policy if exists "admin manage videos" on public.videos;
create policy "admin manage videos" on public.videos for all to authenticated
  using      (exists (select 1 from public.admins a where a.email = auth.email()))
  with check (exists (select 1 from public.admins a where a.email = auth.email()));

-- 3) Admin can fully manage hero slides
drop policy if exists "admin manage hero" on public.hero_slides;
create policy "admin manage hero" on public.hero_slides for all to authenticated
  using      (exists (select 1 from public.admins a where a.email = auth.email()))
  with check (exists (select 1 from public.admins a where a.email = auth.email()));

-- 4) Admin can READ submissions
drop policy if exists "admin read contacts" on public.contacts;
create policy "admin read contacts" on public.contacts for select to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.email()));

drop policy if exists "admin read donations" on public.donations;
create policy "admin read donations" on public.donations for select to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.email()));

drop policy if exists "admin read partners" on public.partners;
create policy "admin read partners" on public.partners for select to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.email()));

-- =====================================================================
-- AFTER running this:
--   1. Open the site, click Login → "Create an account" with the email
--      above → confirm via the email Supabase sends.
--   2. Go to /admin.html and sign in. You can now manage everything.
-- =====================================================================
