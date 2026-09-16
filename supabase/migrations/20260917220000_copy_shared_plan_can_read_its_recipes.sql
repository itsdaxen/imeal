-- Copying a shared week produced an empty week. Sharing lets the recipient read the
-- plan and its rows, but not the private recipes those rows point at — and the copy
-- joins the two, so every row fell out of the join and nothing was copied.
--
-- Reading them is the whole point: the copy duplicates the recipes into the
-- recipient's own library so the two weeks stop being entangled. So the function runs
-- as its owner and checks for itself that the caller was actually shared this plan,
-- rather than widening what a recipient may read in general.

create or replace function public.copy_shared_plan(
  p_meal_plan_id uuid,
  p_week_start date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_target uuid;
  v_copied integer := 0;
begin
  if v_user is null then
    raise exception 'Only a signed-in person can copy a shared week.'
      using errcode = 'insufficient_privilege';
  end if;

  -- The share is the permission. Without it this function would hand anybody any
  -- week, because it is no longer bound by the policies that stopped it.
  if not exists (
    select 1
    from public.meal_plan_shares as share
    where share.meal_plan_id = p_meal_plan_id
      and share.recipient_id = v_user
  ) then
    raise exception 'That week was not shared with you.'
      using errcode = 'insufficient_privilege';
  end if;

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

revoke execute on function public.copy_shared_plan(uuid, date) from public;
grant execute on function public.copy_shared_plan(uuid, date) to authenticated;
