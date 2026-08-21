-- Named shopping lists, shareable with the people you actually shop with.
--
-- Items move from being owned by a user to belonging to a list, and a week points
-- at the list it fills. Membership is the access boundary, and the owner is stored
-- as a member too so every policy asks one question instead of two.

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index shopping_lists_one_default_per_owner
  on public.shopping_lists (owner_id)
  where is_default;

create table public.shopping_list_members (
  list_id uuid not null references public.shopping_lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index shopping_list_members_user_idx on public.shopping_list_members (user_id);

create trigger shopping_lists_set_updated_at before update on public.shopping_lists
  for each row execute function public.set_updated_at();

-- Definer helpers, so a policy never queries a table whose policy queries back.
create or replace function public.owns_shopping_list(p_list_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.shopping_lists
    where id = p_list_id and owner_id = (select auth.uid())
  );
$$;

create or replace function public.is_list_member(p_list_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.shopping_list_members
    where list_id = p_list_id and user_id = (select auth.uid())
  );
$$;

-- Every user gets one list, and every existing item joins it.
insert into public.shopping_lists (owner_id, name, is_default)
select id, 'Shopping', true
from public.profiles
on conflict do nothing;

insert into public.shopping_list_members (list_id, user_id)
select id, owner_id from public.shopping_lists
on conflict do nothing;

alter table public.shopping_items
  add column list_id uuid references public.shopping_lists (id) on delete cascade;

update public.shopping_items as item
set list_id = list.id
from public.shopping_lists as list
where list.owner_id = item.user_id
  and list.is_default;

delete from public.shopping_items where list_id is null;

alter table public.shopping_items
  alter column list_id set not null;

create index shopping_items_list_id_idx on public.shopping_items (list_id);

-- A week fills one list. Null means the owner's default.
alter table public.meal_plans
  add column target_list_id uuid references public.shopping_lists (id) on delete set null;

alter table public.shopping_lists enable row level security;
alter table public.shopping_list_members enable row level security;

create policy shopping_lists_select_member on public.shopping_lists
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_list_member(id));

create policy shopping_lists_insert_own on public.shopping_lists
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy shopping_lists_update_own on public.shopping_lists
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy shopping_lists_delete_own on public.shopping_lists
  for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy shopping_list_members_select_related on public.shopping_list_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.owns_shopping_list(list_id));

-- Only the owner invites, and only a friend.
create policy shopping_list_members_insert_owner on public.shopping_list_members
  for insert to authenticated
  with check (
    public.owns_shopping_list(list_id)
    and (user_id = (select auth.uid()) or public.is_friend(user_id))
  );

-- The owner can remove anyone; a member can leave.
create policy shopping_list_members_delete_related on public.shopping_list_members
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.owns_shopping_list(list_id));

-- Items follow membership rather than ownership.
drop policy shopping_items_all_own on public.shopping_items;

create policy shopping_items_all_for_members on public.shopping_items
  for all to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id) and user_id = (select auth.uid()));
