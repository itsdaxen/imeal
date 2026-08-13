-- Shopping list generation.
--
-- The legacy application deleted a user's list rows and then inserted replacements
-- from application code. A failure between the two lost the list, and a re-run
-- discarded whatever the user had already ticked off. Generation here is a
-- preserving sync inside one function, so it is atomic and repeatable: rows that
-- are still wanted are left untouched, rows no longer implied by the plan are
-- removed, and manual items are never considered.

create or replace function public.planned_ingredients(p_meal_plan_id uuid)
returns table (name text)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct btrim(ingredient) as name
  from public.meal_plan_items as item
  join public.recipes as recipe on recipe.id = item.recipe_id
  cross join lateral unnest(recipe.ingredients) as ingredient
  where item.meal_plan_id = p_meal_plan_id
    and btrim(ingredient) <> '';
$$;

create or replace function public.sync_generated_shopping_items(p_week_start date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_plan uuid;
  v_added integer := 0;
begin
  select id into v_plan
  from public.meal_plans
  where user_id = v_user
    and week_start = p_week_start;

  if v_plan is null then
    return 0;
  end if;

  -- Only generated rows are ever removed; manual and staple rows are the user's.
  delete from public.shopping_items as item
  where item.meal_plan_id = v_plan
    and item.user_id = v_user
    and item.source = 'generated'
    and not exists (
      select 1
      from public.planned_ingredients(v_plan) as wanted
      where lower(wanted.name) = lower(item.name)
    );

  insert into public.shopping_items (user_id, meal_plan_id, name, source)
  select v_user, v_plan, wanted.name, 'generated'
  from public.planned_ingredients(v_plan) as wanted
  where not exists (
    select 1
    from public.shopping_items as item
    where item.meal_plan_id = v_plan
      and item.user_id = v_user
      and lower(item.name) = lower(wanted.name)
  );

  get diagnostics v_added = row_count;

  return v_added;
end;
$$;

revoke execute on function public.planned_ingredients(uuid) from public;
revoke execute on function public.sync_generated_shopping_items(date) from public;
grant execute on function public.planned_ingredients(uuid) to authenticated;
grant execute on function public.sync_generated_shopping_items(date) to authenticated;
