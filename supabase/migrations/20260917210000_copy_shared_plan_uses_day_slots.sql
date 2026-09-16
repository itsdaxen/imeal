-- Copying a week somebody shared has been failing since a day became a list of meals
-- rather than a set of enabled slots. The function still wrote `enabled_slots`, which
-- no longer exists, so every copy raised undefined_column — and the action that calls
-- it ignored the error and redirected, so the week simply arrived empty.
--
-- Three things were left behind by that change: the column name, the slot_index that
-- says which meal of the day a row is, and the unique constraint the insert conflicts
-- against, which now counts positions rather than kinds.

create or replace function public.copy_shared_plan(
  p_meal_plan_id uuid,
  p_week_start date
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_target uuid;
  v_copied integer := 0;
begin
  insert into public.meal_plans (user_id, week_start, day_slots)
  select v_user, p_week_start, source.day_slots
  from public.meal_plans as source
  where source.id = p_meal_plan_id
  on conflict (user_id, week_start)
    do update set day_slots = excluded.day_slots
  returning id into v_target;

  if v_target is null then
    return 0;
  end if;

  delete from public.meal_plan_items
  where meal_plan_id = v_target
    and not approved;

  with source_items as (
    select item.day_index, item.slot_index, item.slot, recipe.*
    from public.meal_plan_items as item
    join public.recipes as recipe on recipe.id = item.recipe_id
    where item.meal_plan_id = p_meal_plan_id
  ),
  copied as (
    insert into public.recipes (
      owner_id, title, ingredients, steps, tip, image_url,
      prep_minutes, servings, meal_tags, source_recipe_id
    )
    select
      v_user, title, ingredients, steps, tip, image_url,
      prep_minutes, servings, meal_tags, id
    from source_items
    where visibility = 'private'
      and owner_id <> v_user
    returning id, source_recipe_id
  )
  insert into public.meal_plan_items (
    meal_plan_id, recipe_id, day_index, slot_index, slot
  )
  select
    v_target,
    coalesce(copied.id, source_items.id),
    source_items.day_index,
    source_items.slot_index,
    source_items.slot
  from source_items
  left join copied on copied.source_recipe_id = source_items.id
  on conflict (meal_plan_id, day_index, slot_index) do nothing;

  get diagnostics v_copied = row_count;

  return v_copied;
end;
$$;
