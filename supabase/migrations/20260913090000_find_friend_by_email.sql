-- Finding someone to add should not mean guessing how they spelled their own name,
-- and it must not mean being able to list the people who use this app.
--
-- Exact address only: a partial match over emails turns the friend search into an
-- enumeration tool. The address itself is never returned — only whether a matching,
-- discoverable profile exists and what it is called — so this cannot be used to read
-- anyone's email either.
--
-- security definer because auth.users is not readable by the signed-in role; the
-- function is the whole of the access, and it grants nothing beyond this answer.
create or replace function public.find_friend_by_email(p_email text)
returns table (id uuid, display_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null or coalesce(trim(p_email), '') = '' then
    return;
  end if;

  return query
  select profile.id, profile.display_name
  from auth.users as account
  join public.profiles as profile on profile.id = account.id
  where lower(account.email) = lower(trim(p_email))
    and profile.friend_discoverable
    and profile.id <> v_user;
end;
$$;

revoke all on function public.find_friend_by_email(text) from public;
grant execute on function public.find_friend_by_email(text) to authenticated;
