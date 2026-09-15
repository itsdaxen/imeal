-- Restores one line lost when this function was recreated for omissions.
--
-- Building the list again deletes generated rows whose name no longer matches a
-- planned ingredient, and organizing renames them. Without this, a row you added by
-- hand and then merged into a planned one went with it: rename the merged row, press
-- Add to shopping list, and your own shopping was gone. Editing a generated row makes
-- it yours, and the rebuild leaves yours alone. Staples and manual rows are untouched.

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
  if jsonb_typeof(p_changes) is distinct from 'object'
    or jsonb_typeof(p_changes -> 'items') is distinct from 'array'
    or jsonb_typeof(p_changes -> 'omitted') is distinct from 'array'
  then
    raise exception 'An organization proposal must contain items and omitted arrays.';
  end if;

  for v_change in select * from jsonb_array_elements(p_changes -> 'items')
  loop
    select coalesce(array_agg(value::uuid), '{}') into v_source_ids
    from jsonb_array_elements_text(coalesce(v_change -> 'sourceIds', '[]'::jsonb));

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
      source = case
        when item.source = 'generated'
          and (
            item.name is distinct from (v_change ->> 'name')
            or cardinality(v_merged) > 0
          )
        then 'manual'::public.shopping_item_source
        else item.source
      end,
      checked = item.checked and not exists (
        select 1 from public.shopping_items as folded
        where folded.id = any (v_merged)
          and folded.list_id = p_list
          and not folded.checked
      ),
      updated_at = now()
    where item.id = v_primary and item.list_id = p_list;

    if found then
      delete from public.shopping_items as folded
      where folded.id = any (v_merged) and folded.list_id = p_list;
      v_applied := v_applied + 1;
    end if;
  end loop;

  for v_change in select * from jsonb_array_elements(p_changes -> 'omitted')
  loop
    select coalesce(array_agg(value::uuid), '{}') into v_source_ids
    from jsonb_array_elements_text(coalesce(v_change -> 'sourceIds', '[]'::jsonb));

    if cardinality(v_source_ids) = 0 then
      raise exception 'Every omitted item needs a source.';
    end if;

    delete from public.shopping_items as item
    where item.id = any (v_source_ids) and item.list_id = p_list;
    v_applied := v_applied + cardinality(v_source_ids);
  end loop;

  return v_applied;
end;
$$;
