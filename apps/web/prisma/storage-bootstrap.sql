-- BrightMoments/Sakany: Supabase Storage bootstrap
-- Run this ONCE in the Supabase SQL editor to create the listing-photos bucket
-- with public read access and authenticated uploads via the service-role API.

-- 1) Create the bucket (public: files are readable via public URL for <img>/next-image)
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- 2) Allow authenticated users to upload to listing-photos (RLS policy on storage.objects)
create policy "Authenticated users can upload listing photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] is not null
);

-- 3) Allow public read on listing-photos (public bucket makes these redundant,
-- but explicit policies are defense-in-depth)
create policy "Public read listing photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'listing-photos');