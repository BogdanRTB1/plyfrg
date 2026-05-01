-- Supabase Storage setup for creator game assets
-- Run this in Supabase SQL Editor with a project admin role.

-- 1) Ensure bucket exists and is public-read
insert into storage.buckets (id, name, public)
values ('game-assets', 'game-assets', true)
on conflict (id) do update set public = true;

-- 2) Recreate policies safely
drop policy if exists "Game assets are publicly readable" on storage.objects;
drop policy if exists "Authenticated creators can upload game assets" on storage.objects;
drop policy if exists "Creators can update their game assets" on storage.objects;
drop policy if exists "Creators can delete their game assets" on storage.objects;

-- Public read for all files in game-assets
create policy "Game assets are publicly readable"
on storage.objects
for select
using (bucket_id = 'game-assets');

-- Upload allowed only for authenticated user in own folder:
-- creator-games/{auth.uid()}/{type}/file.ext
create policy "Authenticated creators can upload game assets"
on storage.objects
for insert
with check (
    bucket_id = 'game-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'creator-games'
    and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Creators can update their game assets"
on storage.objects
for update
using (
    bucket_id = 'game-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'creator-games'
    and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Creators can delete their game assets"
on storage.objects
for delete
using (
    bucket_id = 'game-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'creator-games'
    and (storage.foldername(name))[2] = auth.uid()::text
);
