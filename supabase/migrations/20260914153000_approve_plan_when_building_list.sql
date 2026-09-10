-- Building the whole week's shopping list is also the user's approval of every
-- meal currently in that plan. Keep both changes in this function so they commit
-- together rather than leaving the planner and shopping list out of sync.

create or replace function public.sync_generated_shopping_items(p_week_start date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_plan uuid;
  v_list uuid;
  v_added integer := 0;
begin
  select id, coalesce(target_list_id, public.default_shopping_list(v_user))
  into v_plan, v_list
  from public.meal_plans
  where user_id = v_user
    and week_start = p_week_start;

  if v_plan is null or v_list is null then
    return 0;
  end if;

  delete from public.shopping_items as item
  where item.meal_plan_id = v_plan
    and item.list_id = v_list
    and item.source = 'generated'
    and not exists (
      select 1
      from public.planned_ingredients(v_plan) as wanted
      where lower(wanted.name) = lower(item.name)
    );

  insert into public.shopping_items (user_id, list_id, meal_plan_id, name, source)
  select v_user, v_list, v_plan, wanted.name, 'generated'
  from public.planned_ingredients(v_plan) as wanted
  where not exists (
    select 1
    from public.shopping_items as item
    where item.list_id = v_list
      and lower(item.name) = lower(wanted.name)
  );

  get diagnostics v_added = row_count;

  update public.meal_plan_items
  set approved = true
  where meal_plan_id = v_plan
    and not approved;

  return v_added;
end;
$$;
