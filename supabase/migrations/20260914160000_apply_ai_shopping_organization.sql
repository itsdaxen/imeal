-- Apply the exact model proposal the member reviewed. The server has already checked
-- that every current row appears exactly once; this function preserves atomicity and
-- scopes every update and merge to the selected list.

create or replace function public.apply_shopping_tidy(p_list uuid, p_changes jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_change jsonb;
  v_source_ids uuid[];
  v_primary uuid;
  v_merged uuid[];
  v_applied integer := 0;
begin
  if jsonb_typeof(p_changes) is distinct from 'array' then
    raise exception 'An organization proposal must be an array.';
  end if;

  for v_change in select * from jsonb_array_elements(p_changes)
  loop
    select coalesce(array_agg(value::uuid), '{}')
    into v_source_ids
    from jsonb_array_elements_text(
      coalesce(v_change -> 'sourceIds', '[]'::jsonb)
    );

    if cardinality(v_source_ids) = 0 then
      raise exception 'Every organized item needs a source.';
    end if;

    v_primary := v_source_ids[1];
    v_merged := v_source_ids[2:cardinality(v_source_ids)];

    update public.shopping_items as item
    set
      name = v_change ->> 'name',
      category = v_change ->> 'category',
      quantity = (v_change ->> 'quantity')::smallint,
      unit = nullif(v_change ->> 'unit', ''),
      checked = item.checked and not exists (
        select 1
        from public.shopping_items as folded
        where folded.id = any (v_merged)
          and folded.list_id = p_list
          and not folded.checked
      ),
      updated_at = now()
    where item.id = v_primary
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
