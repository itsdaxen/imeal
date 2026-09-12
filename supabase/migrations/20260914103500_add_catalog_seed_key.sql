-- Stable identity for curated catalog records. This lets the catalog importer update
-- its own entries without matching on editable display copy such as the title.
alter table public.recipes
add column catalog_seed_key text
check (catalog_seed_key is null or catalog_seed_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

alter table public.recipes
add constraint recipes_catalog_seed_key_unique unique (catalog_seed_key);

alter table public.recipes
add constraint recipes_catalog_seed_key_is_public check (
  catalog_seed_key is null
  or (owner_id is null and visibility = 'public')
);
