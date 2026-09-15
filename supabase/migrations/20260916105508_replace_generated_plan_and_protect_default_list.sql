-- Generating is an explicit replacement: a meal the person approved earlier belongs
-- to the old plan just as much as an unapproved one does. Keeping it makes the new
-- shape collide with old slots and leaves a mixture of two generations.
create or replace function public.apply_generated_plan(
  p_week_start date,
  p_slots public.meal_slot[],
  p_assignments jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_plan uuid;
  v_added integer := 0;
  v_days jsonb := (
    select jsonb_agg(to_jsonb(p_slots)) from generate_series(1, 7)
  );
begin
  insert into public.meal_plans (user_id, week_start, day_slots)
  values (v_user, p_week_start, v_days)
  on conflict (user_id, week_start)
    do update set day_slots = excluded.day_slots
  returning id into v_plan;

  delete from public.meal_plan_items
  where meal_plan_id = v_plan;

  insert into public.meal_plan_items
    (meal_plan_id, recipe_id, day_index, slot_index, slot)
  select
    v_plan,
    (entry ->> 'recipeId')::uuid,
    (entry ->> 'dayIndex')::smallint,
    (entry ->> 'slotIndex')::smallint,
    (entry ->> 'slot')::public.meal_slot
  from jsonb_array_elements(p_assignments) as entry;

  get diagnostics v_added = row_count;

  return v_added;
end;
$$;

-- The default list is the destination used whenever no list was chosen. Application
-- controls hide deletion too, while this policy protects direct Data API requests.
drop policy shopping_lists_delete_own on public.shopping_lists;

create policy shopping_lists_delete_non_default_own on public.shopping_lists
  for delete to authenticated
  using (
    owner_id = (select auth.uid())
    and not is_default
  );
