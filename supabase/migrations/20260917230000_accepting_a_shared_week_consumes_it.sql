-- A shared week is an invitation, not a subscription.
--
-- Copying one left the invitation standing: it sat in the recipient's planner
-- forever, and the sharer's menu went on offering to stop sharing a week that had
-- already been taken. Dismissing an invitation always consumed it; accepting one now
-- does the same, which is why neither side needs to watch the other for changes.
--
-- And a recipe already taken from somebody is not taken again. Sharing the same week
-- twice, or two weeks holding the same recipe, used to leave the recipient with a
-- library full of identical copies. Copying a single shared recipe has always reused
-- the copy you already have; this now matches it.

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
  already_mine as (
    select mine.id, mine.source_recipe_id
    from public.recipes as mine
    where mine.owner_id = v_user
      and mine.status = 'active'
      and mine.source_recipe_id in (select id from source_items)
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
      and not exists (
        select 1
        from already_mine
        where already_mine.source_recipe_id = source_items.id
      )
    returning id, source_recipe_id
  ),
  mine as (
    select source_recipe_id, id from copied
    union all
    select source_recipe_id, id from already_mine
  )
  insert into public.meal_plan_items (
    meal_plan_id, recipe_id, day_index, slot_index, slot
  )
  select
    v_target,
    coalesce(mine.id, source_items.id),
    source_items.day_index,
    source_items.slot_index,
    source_items.slot
  from source_items
  left join mine on mine.source_recipe_id = source_items.id
  on conflict (meal_plan_id, day_index, slot_index) do nothing;

  get diagnostics v_copied = row_count;

  -- Taken, so the invitation is spent: gone from the recipient's planner and from
  -- the sharer's list of who has it.
  delete from public.meal_plan_shares
  where meal_plan_id = p_meal_plan_id
    and recipient_id = v_user;

  return v_copied;
end;
$$;
