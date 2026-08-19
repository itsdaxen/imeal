-- Avatars and recipe photographs.
--
-- The legacy recipe-image policy was `with check (bucket_id = 'recipe-images')`:
-- any authenticated user could write anything into a public bucket, under any
-- name, at any size. Here every write is scoped to a folder named for the
-- uploader, and the buckets themselves cap size and declare which types they
-- accept, so the limits hold even if a policy is later loosened.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('recipe-images', 'recipe-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Both buckets are readable by anyone: an avatar appears next to a shared recipe,
-- and catalog photographs are public by definition.
create policy images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('avatars', 'recipe-images'));

-- The first folder of the path is the uploader's id, which is what scopes every
-- write. A user cannot write outside their own folder, in either bucket.
create policy images_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'recipe-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy images_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars', 'recipe-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'recipe-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy images_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'recipe-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
