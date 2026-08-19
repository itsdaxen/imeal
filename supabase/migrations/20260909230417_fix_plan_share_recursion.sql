-- The meal_plan_shares insert policy checked ownership with a subquery against
-- meal_plans, whose select policy checks meal_plan_shares. Postgres detected the
-- cycle and refused every share.
--
-- This is the second time the same shape has appeared — recipe_shares had it too.
-- The rule: a policy on one table must not query a table whose own policy queries
-- back. Ownership goes through a security-definer function, which reads without
-- re-entering policies.

create or replace function public.owns_meal_plan(p_meal_plan_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.meal_plans
    where id = p_meal_plan_id
      and user_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_meal_plan(uuid) from public;
grant execute on function public.owns_meal_plan(uuid) to authenticated;

drop policy meal_plan_shares_insert_owner on public.meal_plan_shares;

create policy meal_plan_shares_insert_owner on public.meal_plan_shares
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and public.is_friend(recipient_id)
    and public.owns_meal_plan(meal_plan_id)
  );
