-- The search result draws the same row as the friends list, so it needs the same
-- photograph. Returned alongside the name because a face is how you confirm you have
-- the right person before sending them a request.
-- Dropped rather than replaced: Postgres will not change the row type of an existing
-- function, and the result gains a column here.
drop function if exists public.find_friend_by_email(text);

create function public.find_friend_by_email(p_email text)
returns table (id uuid, display_name text, avatar_url text)
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
  select profile.id, profile.display_name, profile.avatar_url
  from auth.users as account
  join public.profiles as profile on profile.id = account.id
  where lower(account.email) = lower(trim(p_email))
    and profile.friend_discoverable
    and profile.id <> v_user;
end;
$$;

revoke all on function public.find_friend_by_email(text) from public;
grant execute on function public.find_friend_by_email(text) to authenticated;
