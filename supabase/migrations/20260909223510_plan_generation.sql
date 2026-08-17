-- Filling a week from your recipes.
--
-- The legacy version deleted every item in the plan and inserted replacements from
-- application code, which meant a failure between the two lost the week — and it
-- discarded approvals, so the approve feature fought the generate feature. Here
-- approved meals are the user's decisions: generation never touches them, and the
-- whole replacement happens in one function so it cannot half-apply.

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

  insert into public.meal_plan_items (meal_plan_id, recipe_id, day_index, slot)
  select
    v_plan,
    (entry ->> 'recipeId')::uuid,
    (entry ->> 'dayIndex')::smallint,
    (entry ->> 'slot')::public.meal_slot
  from jsonb_array_elements(p_assignments) as entry;

  get diagnostics v_added = row_count;

  return v_added;
end;
$$;

revoke execute on function public.apply_generated_plan(date, public.meal_slot[], jsonb) from public;
grant execute on function public.apply_generated_plan(date, public.meal_slot[], jsonb) to authenticated;
