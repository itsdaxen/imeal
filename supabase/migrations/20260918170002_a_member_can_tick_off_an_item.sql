-- A shared list is shopped by whoever is in the shop, but only the person who added
-- an item could change it.
--
-- One policy covered every write on shopping_items, so its check ran against the row
-- an update would leave behind as well as the row an insert would create. Requiring
-- user_id to be yours is right when adding: you own what you put on the list. On an
-- update it asked something else entirely — that the row still belong to you
-- afterwards — and a row somebody else added never does. The row was readable, the
-- update matched it, and the write was refused. Ticking an item off, renaming one,
-- or accepting an organization did nothing, for exactly the people sharing the list
-- was meant to serve.
--
-- Split by command, so each asks its own question. Membership decides what you may
-- read, change, and remove; adding additionally stamps the row as yours. An update
-- still has to leave the item on a list you belong to, so a row cannot be moved
-- somewhere you cannot reach.

drop policy shopping_items_all_for_members on public.shopping_items;

create policy shopping_items_select_members on public.shopping_items
  for select to authenticated
  using (public.is_list_member(list_id));

create policy shopping_items_insert_members on public.shopping_items
  for insert to authenticated
  with check (
    public.is_list_member(list_id)
    and user_id = (select auth.uid())
  );

create policy shopping_items_update_members on public.shopping_items
  for update to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id));

create policy shopping_items_delete_members on public.shopping_items
  for delete to authenticated
  using (public.is_list_member(list_id));
