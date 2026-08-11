-- Row Level Security for the core schema.
--
-- Access matrix (anonymous / owner / other authenticated user / admin):
--   profiles         none          / read+write own    / read discoverable  / read all
--   user_roles       none          / read own          / none               / read all
--   recipes          read catalog  / all own private   / read catalog       / all
--   meal_plans       none          / all own           / none               / none
--   meal_plan_items  none          / all via own plan  / none               / none
--   staples          none          / all own           / none               / none
--   shopping_items   none          / all own           / none               / none
--
-- Admin is deliberately absent from the planning tables: moderating the catalog
-- never requires reading a user's private week.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.recipes enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.staples enable row level security;
alter table public.shopping_items enable row level security;

-- Reads user_roles as the definer because the caller may only see their own row.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy profiles_select_self_or_discoverable on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or friend_discoverable or public.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No insert or delete policy: profiles are created by the auth trigger and
-- removed by the cascade from auth.users.

create policy user_roles_select_own on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- No write policy of any kind. Roles are granted out of band by the service role,
-- which bypasses RLS. This is what stops a user from making themselves an admin.

create policy recipes_select_own_or_catalog on public.recipes
  for select to anon, authenticated
  using (
    (visibility = 'public' and status = 'active')
    or owner_id = (select auth.uid())
    or public.is_admin()
  );

create policy recipes_insert_own on public.recipes
  for insert to authenticated
  with check (
    (visibility = 'private' and owner_id = (select auth.uid()))
    or (visibility = 'public' and owner_id is null and public.is_admin())
  );

create policy recipes_update_own on public.recipes
  for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (
    (visibility = 'private' and owner_id = (select auth.uid()))
    or (visibility = 'public' and owner_id is null and public.is_admin())
  );

create policy recipes_delete_own on public.recipes
  for delete to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());

create policy meal_plans_all_own on public.meal_plans
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy meal_plan_items_all_via_own_plan on public.meal_plan_items
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

create policy staples_all_own on public.staples
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy shopping_items_all_own on public.shopping_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
