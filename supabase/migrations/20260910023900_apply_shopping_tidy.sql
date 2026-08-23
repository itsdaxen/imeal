-- Applying a tidy proposal is one statement per row inside one transaction, so a list
-- is never briefly emptied the way a delete-then-insert would leave it.

create or replace function public.apply_shopping_tidy(p_list uuid, p_changes jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_change jsonb;
  v_merged uuid[];
  v_applied integer := 0;
begin
  if jsonb_typeof(p_changes) is distinct from 'array' then
    raise exception 'A tidy proposal must be an array.';
  end if;

  for v_change in select * from jsonb_array_elements(p_changes)
  loop
    select coalesce(array_agg(value::uuid), '{}')
    into v_merged
    from jsonb_array_elements_text(coalesce(v_change -> 'mergedIds', '[]'::jsonb));

    update public.shopping_items as item
    set
      name = v_change ->> 'name',
      category = v_change ->> 'category',
      quantity = (v_change ->> 'quantity')::smallint,
      -- A merged row that was still outstanding leaves the total outstanding.
      checked = item.checked and not exists (
        select 1
        from public.shopping_items as folded
        where folded.id = any (v_merged)
          and folded.list_id = p_list
          and not folded.checked
      ),
      updated_at = now()
    where item.id = (v_change ->> 'id')::uuid
      and item.list_id = p_list;

    if found then
      delete from public.shopping_items as folded
      where folded.id = any (v_merged)
        and folded.list_id = p_list;

      v_applied := v_applied + 1;
    end if;
  end loop;

  return v_applied;
end;
$$;

revoke execute on function public.apply_shopping_tidy(uuid, jsonb) from public;
grant execute on function public.apply_shopping_tidy(uuid, jsonb) to authenticated;
