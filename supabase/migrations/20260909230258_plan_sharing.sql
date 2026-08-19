-- Sharing a week with a friend.
--
-- A plan is only meaningful if its recipes are readable, so sharing a plan shares
-- the private recipes inside it through the mechanism that already exists rather
-- than inventing a second one. Copying makes the recipient their own recipes, so
-- the two weeks stop being entangled the moment it is taken.

create table public.meal_plan_shares (
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meal_plan_id, recipient_id),
  constraint meal_plan_shares_not_self check (owner_id <> recipient_id)
);

create index meal_plan_shares_recipient_idx on public.meal_plan_shares (recipient_id);

alter table public.meal_plan_shares enable row level security;

create policy meal_plan_shares_select_related on public.meal_plan_shares
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  );

create policy meal_plan_shares_insert_owner on public.meal_plan_shares
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and public.is_friend(recipient_id)
    and exists (
      select 1
      from public.meal_plans
      where meal_plans.id = meal_plan_shares.meal_plan_id
        and meal_plans.user_id = (select auth.uid())
    )
  );

-- The owner can withdraw it; the recipient can dismiss it.
create policy meal_plan_shares_delete_related on public.meal_plan_shares
  for delete to authenticated
  using (
    owner_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  );

-- A shared week has to be readable, so the two planning policies widen to match
-- what recipes already do.
drop policy meal_plans_all_own on public.meal_plans;

create policy meal_plans_select_own_or_shared on public.meal_plans
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.meal_plan_shares
      where meal_plan_shares.meal_plan_id = meal_plans.id
        and meal_plan_shares.recipient_id = (select auth.uid())
    )
  );

create policy meal_plans_write_own on public.meal_plans
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy meal_plan_items_all_via_own_plan on public.meal_plan_items;

create policy meal_plan_items_select_visible_plan on public.meal_plan_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.meal_plans
      where meal_plans.id = meal_plan_items.meal_plan_id
        and (
          meal_plans.user_id = (select auth.uid())
          or exists (
            select 1
            from public.meal_plan_shares
            where meal_plan_shares.meal_plan_id = meal_plans.id
              and meal_plan_shares.recipient_id = (select auth.uid())
          )
        )
    )
  );

create policy meal_plan_items_write_own_plan on public.meal_plan_items
  for all to authenticated
  using (
    exists (
      select 1
      from public.meal_plans
      where meal_plans.id = meal_plan_items.meal_plan_id
        and meal_plans.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.meal_plans
      where meal_plans.id = meal_plan_items.meal_plan_id
        and meal_plans.user_id = (select auth.uid())
    )
  );

-- Sharing the week also shares the private recipes in it, so the recipient can
-- actually read what they have been sent.
create or replace function public.share_meal_plan(
  p_meal_plan_id uuid,
  p_recipient uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  insert into public.meal_plan_shares (meal_plan_id, owner_id, recipient_id)
  values (p_meal_plan_id, v_user, p_recipient)
  on conflict do nothing;

  insert into public.recipe_shares (recipe_id, shared_with, shared_by)
  select distinct recipe.id, p_recipient, v_user
  from public.meal_plan_items as item
  join public.recipes as recipe on recipe.id = item.recipe_id
  where item.meal_plan_id = p_meal_plan_id
    and recipe.owner_id = v_user
  on conflict do nothing;
end;
$$;

-- Copying takes a private recipe into the recipient's own library, so editing it
-- later cannot reach back into the week it came from.
create or replace function public.copy_shared_plan(
  p_meal_plan_id uuid,
  p_week_start date
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_target uuid;
  v_copied integer := 0;
begin
  insert into public.meal_plans (user_id, week_start, enabled_slots)
  select v_user, p_week_start, source.enabled_slots
  from public.meal_plans as source
  where source.id = p_meal_plan_id
  on conflict (user_id, week_start)
    do update set enabled_slots = excluded.enabled_slots
  returning id into v_target;

  if v_target is null then
    return 0;
  end if;

  delete from public.meal_plan_items
  where meal_plan_id = v_target
    and not approved;

  with source_items as (
    select item.day_index, item.slot, recipe.*
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
  insert into public.meal_plan_items (meal_plan_id, recipe_id, day_index, slot)
  select
    v_target,
    coalesce(copied.id, source_items.id),
    source_items.day_index,
    source_items.slot
  from source_items
  left join copied on copied.source_recipe_id = source_items.id
  on conflict (meal_plan_id, day_index, slot) do nothing;

  get diagnostics v_copied = row_count;

  return v_copied;
end;
$$;

revoke execute on function public.share_meal_plan(uuid, uuid) from public;
revoke execute on function public.copy_shared_plan(uuid, date) from public;
grant execute on function public.share_meal_plan(uuid, uuid) to authenticated;
grant execute on function public.copy_shared_plan(uuid, date) to authenticated;
