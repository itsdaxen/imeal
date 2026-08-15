-- The recipe_shares insert policy checked ownership with a subquery against
-- recipes, whose own select policy checks recipe_shares. Postgres detected the
-- cycle and refused every insert with "infinite recursion detected in policy".
--
-- Ownership is now checked through a security-definer function, which reads the
-- table without re-entering its policies and breaks the loop.

create or replace function public.owns_recipe(p_recipe_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.recipes
    where id = p_recipe_id
      and owner_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_recipe(uuid) from public;
grant execute on function public.owns_recipe(uuid) to authenticated;

drop policy recipe_shares_insert_owner on public.recipe_shares;

create policy recipe_shares_insert_owner on public.recipe_shares
  for insert to authenticated
  with check (
    shared_by = (select auth.uid())
    and public.is_friend(shared_with)
    and public.owns_recipe(recipe_id)
  );
