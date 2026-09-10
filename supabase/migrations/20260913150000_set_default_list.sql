-- Moving the default from one list to another is two writes that must not be seen
-- apart: a unique index allows only one default per owner, so the old one has to be
-- cleared before the new one is set, and a failure between the two would leave you
-- with no default at all. One function is one transaction.
create or replace function public.set_default_shopping_list(p_list uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  update public.shopping_lists
  set is_default = false
  where owner_id = v_user
    and is_default;

  update public.shopping_lists
  set is_default = true
  where id = p_list
    and owner_id = v_user;
end;
$$;

revoke all on function public.set_default_shopping_list(uuid) from public;
grant execute on function public.set_default_shopping_list(uuid) to authenticated;
