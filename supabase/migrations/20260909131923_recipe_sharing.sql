-- Sharing a private recipe with a friend.
--
-- Sharing grants read access only: the update and delete policies on recipes still
-- require ownership, so a recipient can cook from a recipe but never change it.
-- Ending a friendship revokes the shares in both directions, so access does not
-- outlive the relationship that justified it.

create table public.recipe_shares (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  shared_with uuid not null references public.profiles (id) on delete cascade,
  shared_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipe_id, shared_with),
  constraint recipe_shares_not_self check (shared_with <> shared_by)
);

create index recipe_shares_shared_with_idx on public.recipe_shares (shared_with);

alter table public.recipe_shares enable row level security;

create policy recipe_shares_select_related on public.recipe_shares
  for select to authenticated
  using (
    shared_by = (select auth.uid())
    or shared_with = (select auth.uid())
  );

-- Only the recipe's owner may share it, and only with a current friend.
create policy recipe_shares_insert_owner on public.recipe_shares
  for insert to authenticated
  with check (
    shared_by = (select auth.uid())
    and public.is_friend(shared_with)
    and exists (
      select 1
      from public.recipes
      where recipes.id = recipe_shares.recipe_id
        and recipes.owner_id = (select auth.uid())
    )
  );

-- The owner can unshare; the recipient can drop it from their own list.
create policy recipe_shares_delete_related on public.recipe_shares
  for delete to authenticated
  using (
    shared_by = (select auth.uid())
    or shared_with = (select auth.uid())
  );

drop policy recipes_select_own_or_catalog on public.recipes;

create policy recipes_select_own_shared_or_catalog on public.recipes
  for select to anon, authenticated
  using (
    (visibility = 'public' and status = 'active')
    or owner_id = (select auth.uid())
    or exists (
      select 1
      from public.recipe_shares
      where recipe_shares.recipe_id = recipes.id
        and recipe_shares.shared_with = (select auth.uid())
    )
    or public.is_admin()
  );

create or replace function public.revoke_shares_between_former_friends()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.recipe_shares
  where (shared_by = old.user_id and shared_with = old.friend_id)
     or (shared_by = old.friend_id and shared_with = old.user_id);

  return old;
end;
$$;

create trigger friendships_revoke_shares
  after delete on public.friendships
  for each row execute function public.revoke_shares_between_former_friends();
