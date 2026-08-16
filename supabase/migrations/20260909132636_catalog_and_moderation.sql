-- The public catalog and its moderation queue.
--
-- A user suggests one of their own recipes; an admin approves it, which copies it
-- into the catalog as an ownerless public recipe. The original stays private and
-- under its author's control. Approval and rejection are security-definer
-- functions that check is_admin(), and admin itself is not self-service — see the
-- user_roles table, which has no write policy at all.

create type public.suggestion_status as enum ('pending', 'approved', 'rejected');

create table public.recipe_suggestions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  suggested_by uuid not null references public.profiles (id) on delete cascade,
  status public.suggestion_status not null default 'pending',
  reviewer_note text check (char_length(reviewer_note) <= 500),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index recipe_suggestions_one_pending
  on public.recipe_suggestions (recipe_id)
  where status = 'pending';

create index recipe_suggestions_pending_idx
  on public.recipe_suggestions (created_at)
  where status = 'pending';

alter table public.recipe_suggestions enable row level security;

create policy recipe_suggestions_select_own_or_admin on public.recipe_suggestions
  for select to authenticated
  using (suggested_by = (select auth.uid()) or public.is_admin());

create policy recipe_suggestions_insert_own on public.recipe_suggestions
  for insert to authenticated
  with check (
    suggested_by = (select auth.uid())
    and status = 'pending'
    and public.owns_recipe(recipe_id)
  );

-- Withdrawing your own suggestion before it is reviewed.
create policy recipe_suggestions_delete_own on public.recipe_suggestions
  for delete to authenticated
  using (suggested_by = (select auth.uid()) and status = 'pending');

-- No update policy: reviewing goes through the functions below, which check is_admin().

create or replace function public.approve_recipe_suggestion(p_suggestion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_recipe uuid;
  v_published uuid;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator may review suggestions.'
      using errcode = 'insufficient_privilege';
  end if;

  update public.recipe_suggestions
  set status = 'approved', reviewed_by = v_admin, reviewed_at = now()
  where id = p_suggestion_id
    and status = 'pending'
  returning recipe_id into v_recipe;

  if v_recipe is null then
    raise exception 'No pending suggestion to approve.' using errcode = 'check_violation';
  end if;

  -- The catalog entry is a copy, so the author keeps editing their own version
  -- without silently changing what everyone else sees.
  insert into public.recipes (
    owner_id, title, ingredients, steps, tip, image_url,
    prep_minutes, servings, visibility, status, meal_tags, source_recipe_id
  )
  select
    null, title, ingredients, steps, tip, image_url,
    prep_minutes, servings, 'public', 'active', meal_tags, id
  from public.recipes
  where id = v_recipe
  returning id into v_published;

  return v_published;
end;
$$;

create or replace function public.reject_recipe_suggestion(
  p_suggestion_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator may review suggestions.'
      using errcode = 'insufficient_privilege';
  end if;

  update public.recipe_suggestions
  set status = 'rejected',
      reviewer_note = left(p_note, 500),
      reviewed_by = (select auth.uid()),
      reviewed_at = now()
  where id = p_suggestion_id
    and status = 'pending';
end;
$$;

create or replace function public.archive_catalog_recipe(p_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator may moderate the catalog.'
      using errcode = 'insufficient_privilege';
  end if;

  update public.recipes
  set status = 'archived'
  where id = p_recipe_id
    and visibility = 'public';
end;
$$;

revoke execute on function public.approve_recipe_suggestion(uuid) from public;
revoke execute on function public.reject_recipe_suggestion(uuid, text) from public;
revoke execute on function public.archive_catalog_recipe(uuid) from public;
grant execute on function public.approve_recipe_suggestion(uuid) to authenticated;
grant execute on function public.reject_recipe_suggestion(uuid, text) to authenticated;
grant execute on function public.archive_catalog_recipe(uuid) to authenticated;
