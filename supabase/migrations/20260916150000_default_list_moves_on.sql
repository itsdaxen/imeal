-- Refusing to delete the default list was the wrong way round: a list you no longer
-- want is a list you should be able to throw away, and which one is the default is a
-- detail the application can keep straight by itself. So deleting it is allowed again
-- and the default moves to another list.
--
-- The one list that cannot go is the last one. Every week without a chosen
-- destination falls back to `default_shopping_list`, and with no lists at all it
-- returns nothing and building a list quietly does nothing.
--
-- Both rules are triggers rather than application code, so they hold for a direct
-- Data API request as much as for the button.

drop policy shopping_lists_delete_non_default_own on public.shopping_lists;

create policy shopping_lists_delete_own on public.shopping_lists
  for delete to authenticated
  using (owner_id = (select auth.uid()));

create or replace function public.keep_one_shopping_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.shopping_lists as other
    where other.owner_id = old.owner_id
      and other.id <> old.id
  ) then
    raise exception 'A shopping list has to exist, so the last one cannot be deleted.'
      using errcode = 'restrict_violation';
  end if;

  return old;
end;
$$;

-- The oldest list left, because "the next one" has to mean the same thing every time
-- and creation order is the only order these have.
create or replace function public.move_default_shopping_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not old.is_default then
    return null;
  end if;

  update public.shopping_lists as heir
  set is_default = true, updated_at = now()
  where heir.id = (
    select id
    from public.shopping_lists
    where owner_id = old.owner_id
    order by created_at, id
    limit 1
  );

  return null;
end;
$$;

create trigger shopping_lists_keep_one
  before delete on public.shopping_lists
  for each row
  execute function public.keep_one_shopping_list();

create trigger shopping_lists_move_default
  after delete on public.shopping_lists
  for each row
  execute function public.move_default_shopping_list();
