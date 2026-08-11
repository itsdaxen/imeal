-- Core schema for the solo planning loop: profiles, recipes, weekly plans,
-- shopping, and staples. Collaboration, the public catalog, and admin moderation
-- arrive in later migrations.

create type public.app_role as enum ('user', 'admin');
create type public.meal_slot as enum ('breakfast', 'lunch', 'snack', 'dinner');
create type public.recipe_visibility as enum ('private', 'public');
create type public.recipe_status as enum ('active', 'archived');
create type public.shopping_item_source as enum ('generated', 'manual', 'staple');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  avatar_url text,
  friend_discoverable boolean not null default true,
  default_meals_per_week smallint not null default 7
    check (default_meals_per_week between 1 and 28),
  default_enabled_slots public.meal_slot[] not null
    default array['breakfast', 'lunch', 'snack', 'dinner']::public.meal_slot[]
    check (cardinality(default_enabled_slots) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles live outside profiles so that a user editing their own profile can never
-- grant themselves admin. Nothing here is writable through the API.
create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  tip text,
  image_url text,
  prep_minutes smallint not null default 30 check (prep_minutes between 1 and 1440),
  servings smallint not null default 4 check (servings between 1 and 100),
  visibility public.recipe_visibility not null default 'private',
  status public.recipe_status not null default 'active',
  meal_tags public.meal_slot[] not null
    default array['lunch', 'dinner']::public.meal_slot[]
    check (cardinality(meal_tags) > 0),
  source_recipe_id uuid references public.recipes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A catalog recipe belongs to nobody; a private recipe always has an owner.
  constraint recipes_ownership_matches_visibility check (
    (visibility = 'public' and owner_id is null)
    or (visibility = 'private' and owner_id is not null)
  )
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  title text check (char_length(title) between 1 and 120),
  enabled_slots public.meal_slot[] not null
    default array['breakfast', 'lunch', 'snack', 'dinner']::public.meal_slot[]
    check (cardinality(enabled_slots) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start),
  -- Weeks are addressed by their Monday so that two clients cannot create
  -- overlapping plans for the same week.
  constraint meal_plans_week_starts_on_monday check (extract(isodow from week_start) = 1)
);

create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete restrict,
  day_index smallint not null check (day_index between 0 and 6),
  slot public.meal_slot not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meal_plan_id, day_index, slot)
);

create table public.staples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  meal_plan_id uuid references public.meal_plans (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  quantity smallint not null default 1 check (quantity between 1 and 999),
  unit text check (char_length(unit) between 1 and 30),
  category text check (char_length(category) between 1 and 60),
  source public.shopping_item_source not null default 'manual',
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_owner_id_idx on public.recipes (owner_id) where owner_id is not null;
create index recipes_visibility_status_idx on public.recipes (visibility, status);
create index meal_plans_user_id_week_start_idx on public.meal_plans (user_id, week_start desc);
create index meal_plan_items_meal_plan_id_idx on public.meal_plan_items (meal_plan_id);
create index meal_plan_items_recipe_id_idx on public.meal_plan_items (recipe_id);
create index staples_user_id_idx on public.staples (user_id) where active;
create index shopping_items_user_id_idx on public.shopping_items (user_id);
create index shopping_items_meal_plan_id_idx on public.shopping_items (meal_plan_id)
  where meal_plan_id is not null;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger recipes_set_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();
create trigger meal_plans_set_updated_at before update on public.meal_plans
  for each row execute function public.set_updated_at();
create trigger meal_plan_items_set_updated_at before update on public.meal_plan_items
  for each row execute function public.set_updated_at();
create trigger staples_set_updated_at before update on public.staples
  for each row execute function public.set_updated_at();
create trigger shopping_items_set_updated_at before update on public.shopping_items
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
