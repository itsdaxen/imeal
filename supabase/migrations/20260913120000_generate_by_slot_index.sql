-- Generation writes the meal's place in the day as well as its type, because the
-- day may now hold two lunches and "the lunch" no longer identifies one of them.
--
-- `p_slots` is the shape of the day — its types in order, repeats included — so it is
-- both what the plan stores and what the assignments are indexed against.
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
begin
  insert into public.meal_plans (user_id, week_start, enabled_slots)
  values (v_user, p_week_start, p_slots)
  on conflict (user_id, week_start)
    do update set enabled_slots = excluded.enabled_slots
  returning id into v_plan;

  delete from public.meal_plan_items
  where meal_plan_id = v_plan
    and not approved;

  -- An approved meal is kept, so a generated one must not collide with it.
  insert into public.meal_plan_items
    (meal_plan_id, recipe_id, day_index, slot_index, slot)
  select
    v_plan,
    (entry ->> 'recipeId')::uuid,
    (entry ->> 'dayIndex')::smallint,
    (entry ->> 'slotIndex')::smallint,
    (entry ->> 'slot')::public.meal_slot
  from jsonb_array_elements(p_assignments) as entry
  on conflict (meal_plan_id, day_index, slot_index) do nothing;

  get diagnostics v_added = row_count;

  return v_added;
end;
$$;
