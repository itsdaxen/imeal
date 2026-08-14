import type { Metadata } from "next";

import { Button, Input, Label, TextField, Typography } from "@heroui/react";

import { PersonAction } from "@/features/friends/components/person-action";
import { PersonRow } from "@/features/friends/components/person-row";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
  setDiscoverable,
  withdrawFriendRequest,
} from "@/features/friends/friend.actions";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  searchPeople,
} from "@/features/friends/friend.queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Friends" };

async function isDiscoverable() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("profiles")
    .select("friend_discoverable")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return data?.friend_discoverable ?? true;
}

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [friends, incoming, outgoing, matches, discoverable] =
    await Promise.all([
      listFriends(),
      listIncomingRequests(),
      listOutgoingRequests(),
      searchPeople(search ?? ""),
      isDiscoverable(),
    ]);

  const knownIds = new Set([
    ...friends.map((person) => person.id),
    ...outgoing.map((request) => request.person.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 pt-10 sm:pt-14">
      <header className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          Friends
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Share recipes with people you cook with.
        </Typography>
      </header>

      <section className="flex flex-col gap-3">
        <Typography type="h2" weight="semibold">
          Find someone
        </Typography>

        <form
          action="/friends"
          className="flex flex-wrap items-end gap-3"
          role="search"
        >
          <TextField
            className="min-w-56 flex-1"
            defaultValue={search}
            name="search"
          >
            <Label>Search by name</Label>
            <Input placeholder="At least two characters" type="search" />
          </TextField>
          <Button type="submit" variant="tertiary">
            Search
          </Button>
        </form>

        {search && matches.length === 0 ? (
          <Typography className="text-muted" type="body-sm">
            Nobody discoverable matches that name.
          </Typography>
        ) : null}

        {matches.length > 0 ? (
          <ul className="flex list-none flex-col p-0">
            {matches.map((person) => (
              <PersonRow
                actions={
                  knownIds.has(person.id) ? (
                    <span className="text-sm text-muted">
                      Already connected
                    </span>
                  ) : (
                    <PersonAction
                      action={sendFriendRequest}
                      label="Add friend"
                      name="personId"
                      value={person.id}
                    />
                  )
                }
                key={person.id}
                name={person.displayName}
              />
            ))}
          </ul>
        ) : null}
      </section>

      {incoming.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Typography type="h2" weight="semibold">
            Requests for you
          </Typography>
          <ul className="flex list-none flex-col p-0">
            {incoming.map((request) => (
              <PersonRow
                actions={
                  <>
                    <PersonAction
                      action={acceptFriendRequest}
                      label="Accept"
                      name="requestId"
                      value={request.id}
                      variant="primary"
                    />
                    <PersonAction
                      action={declineFriendRequest}
                      label="Decline"
                      name="requestId"
                      value={request.id}
                      variant="ghost"
                    />
                  </>
                }
                key={request.id}
                name={request.person.displayName}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Typography type="h2" weight="semibold">
            Waiting on a reply
          </Typography>
          <ul className="flex list-none flex-col p-0">
            {outgoing.map((request) => (
              <PersonRow
                actions={
                  <PersonAction
                    action={withdrawFriendRequest}
                    label="Withdraw"
                    name="requestId"
                    value={request.id}
                    variant="ghost"
                  />
                }
                key={request.id}
                name={request.person.displayName}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <Typography type="h2" weight="semibold">
          Your friends
        </Typography>

        {friends.length === 0 ? (
          <Typography className="text-muted" type="body-sm">
            No friends yet. Search for someone above.
          </Typography>
        ) : (
          <ul className="flex list-none flex-col p-0">
            {friends.map((person) => (
              <PersonRow
                actions={
                  <PersonAction
                    action={removeFriend}
                    label="Remove"
                    name="personId"
                    value={person.id}
                    variant="ghost"
                  />
                }
                key={person.id}
                name={person.displayName}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border/60 pt-6">
        <Typography type="h2" weight="semibold">
          Discoverability
        </Typography>
        <Typography className="text-muted" type="body-sm">
          {discoverable
            ? "Other people can find you by name."
            : "You are hidden from search. Only people you contact first can add you."}
        </Typography>
        <form action={setDiscoverable}>
          <input
            name="discoverable"
            type="hidden"
            value={String(!discoverable)}
          />
          <Button size="sm" type="submit" variant="tertiary">
            {discoverable ? "Hide me from search" : "Let people find me"}
          </Button>
        </form>
      </section>
    </main>
  );
}
