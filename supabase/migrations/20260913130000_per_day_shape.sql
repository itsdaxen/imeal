-- Each day gets its own run of meals.
--
-- `enabled_slots` described one day and applied it to all seven, so adding a meal to
-- Monday added one to every other day too — the shape was a property of the week when
-- it is really a property of a day. `day_slots` holds seven of them, one per day.
alter table public.meal_plans
  add column day_slots jsonb;

-- Every existing week keeps exactly the days it had: the old single shape, seven times.
-- Written out rather than aggregated: an aggregate in an UPDATE cannot see the row
-- it is updating, and seven is a week however it is spelled.
update public.meal_plans
set day_slots = jsonb_build_array(
  to_jsonb(enabled_slots),
  to_jsonb(enabled_slots),
  to_jsonb(enabled_slots),
  to_jsonb(enabled_slots),
  to_jsonb(enabled_slots),
  to_jsonb(enabled_slots),
  to_jsonb(enabled_slots)
);

alter table public.meal_plans
  alter column day_slots set not null,
  add constraint meal_plans_day_slots_check
    check (jsonb_typeof(day_slots) = 'array' and jsonb_array_length(day_slots) = 7),
  drop column enabled_slots;

-- Generation still offers one shape for the whole week, so it writes the same run into
-- each of the seven days; a day is free to diverge afterwards.
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
  where meal_plan_id = v_plan
    and not approved;

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
