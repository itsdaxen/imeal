-- Friend requests and friendships.
--
-- The legacy schema let a related user insert friendship rows directly, so the
-- intended request-then-accept transition could be bypassed through the API.
-- Here `friendships` has no insert policy at all: rows appear only through
-- accept_friend_request, which verifies the caller is the addressee of a pending
-- request. Forging a friendship is not forbidden by a rule, it is unreachable.

create type public.friend_request_status as enum ('pending', 'accepted', 'declined');

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friend_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_not_self check (requester_id <> addressee_id)
);

-- At most one request may be outstanding in a given direction.
create unique index friend_requests_one_pending
  on public.friend_requests (requester_id, addressee_id)
  where status = 'pending';

create index friend_requests_addressee_idx
  on public.friend_requests (addressee_id)
  where status = 'pending';

-- Stored as two mirrored rows so "my friends" is a single indexed lookup.
create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint friendships_not_self check (user_id <> friend_id)
);

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;

create or replace function public.is_friend(p_other uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships
    where user_id = (select auth.uid())
      and friend_id = p_other
  );
$$;

create or replace function public.accept_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_requester uuid;
begin
  -- Only the addressee of a still-pending request may accept it.
  update public.friend_requests
  set status = 'accepted', responded_at = now()
  where id = p_request_id
    and addressee_id = v_user
    and status = 'pending'
  returning requester_id into v_requester;

  if v_requester is null then
    raise exception 'No pending friend request to accept.'
      using errcode = 'check_violation';
  end if;

  insert into public.friendships (user_id, friend_id)
  values (v_user, v_requester), (v_requester, v_user)
  on conflict do nothing;
end;
$$;

create or replace function public.decline_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.friend_requests
  set status = 'declined', responded_at = now()
  where id = p_request_id
    and addressee_id = (select auth.uid())
    and status = 'pending';
end;
$$;

create policy friend_requests_select_related on public.friend_requests
  for select to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );

create policy friend_requests_insert_own on public.friend_requests
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and not public.is_friend(addressee_id)
  );

-- Withdrawing a request you sent. Responding to one goes through the functions
-- above, so there is deliberately no update policy.
create policy friend_requests_delete_own on public.friend_requests
  for delete to authenticated
  using (requester_id = (select auth.uid()) and status = 'pending');

create policy friendships_select_own on public.friendships
  for select to authenticated
  using (user_id = (select auth.uid()) or friend_id = (select auth.uid()));

-- No insert or update policy: accept_friend_request is the only way in.
create policy friendships_delete_own on public.friendships
  for delete to authenticated
  using (user_id = (select auth.uid()) or friend_id = (select auth.uid()));

revoke execute on function public.is_friend(uuid) from public;
revoke execute on function public.accept_friend_request(uuid) from public;
revoke execute on function public.decline_friend_request(uuid) from public;
grant execute on function public.is_friend(uuid) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.decline_friend_request(uuid) to authenticated;
