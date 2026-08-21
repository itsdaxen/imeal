-- A new account starts with a list, and generation fills the list the week points at.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  insert into public.shopping_lists (owner_id, name, is_default)
  values (new.id, 'Shopping', true)
  returning id into v_list;

  insert into public.shopping_list_members (list_id, user_id)
  values (v_list, new.id);

  return new;
end;
$$;

create or replace function public.default_shopping_list(p_user uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.shopping_lists
  where owner_id = p_user and is_default
  limit 1;
$$;

revoke execute on function public.default_shopping_list(uuid) from public;
grant execute on function public.default_shopping_list(uuid) to authenticated;

-- Unchanged in spirit: a preserving sync that never discards what you have ticked
-- off or added yourself. It now works within the list the week fills.
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

  return v_added;
end;
$$;
