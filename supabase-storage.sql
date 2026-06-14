-- =====================================================================
-- Dinab TV — Storage for admin image uploads (run once).
-- Lets admins upload images in the dashboard; everyone can view them.
-- Supabase → SQL Editor → paste → Run.
-- =====================================================================

-- 1) A public bucket called "media"
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

-- 2) Anyone can VIEW images in the bucket
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');

-- 3) Only admins can UPLOAD / REPLACE / DELETE
drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and exists (select 1 from public.admins a where a.email = auth.email()));

drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and exists (select 1 from public.admins a where a.email = auth.email()));

drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and exists (select 1 from public.admins a where a.email = auth.email()));
