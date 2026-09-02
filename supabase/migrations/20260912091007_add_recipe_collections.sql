alter table public.recipes
add column collection_tags text[] not null default '{}'
check (
  cardinality(collection_tags) <= 12
);

create index recipes_collection_tags_idx
on public.recipes using gin (collection_tags);
