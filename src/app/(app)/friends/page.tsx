import type { Metadata } from "next";

import { Card, Input, Label, TextField, Typography } from "@heroui/react";

import { UsersRound } from "lucide-react";

import { ActionButton, ActionLink } from "@/components/ui/action";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentCard } from "@/components/ui/content-card";
import { PanelTitle } from "@/components/ui/panel-title";
import { PersonAction } from "@/features/friends/components/person-action";
import { PeopleList } from "@/features/friends/components/people-list";
import { PersonRow } from "@/features/friends/components/person-row";
import {
  removeFriend,
  sendFriendRequest,
} from "@/features/friends/friend.actions";
import {
  findPersonByEmail,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
} from "@/features/friends/friend.queries";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const [friends, incoming, outgoing, matches] = await Promise.all([
    listFriends(),
    listIncomingRequests(),
    listOutgoingRequests(),
    findPersonByEmail(email ?? ""),
  ]);

  // Four different things can be true of someone you just looked up, and they used
  // to collapse into two. A request you sent is not a friendship, and someone who
  // asked to add you should not be offered an "Add friend" button that sends a second
  // request back the other way.
  const friendIds = new Set(friends.map((person) => person.id));
  const sentIds = new Set(outgoing.map((request) => request.person.id));
  const receivedIds = new Set(incoming.map((request) => request.person.id));

  return (
    <>
      <ContentCard>
        <Card.Header>
          <PanelTitle>Add someone by email</PanelTitle>
        </Card.Header>

        <Card.Content>
          <form
            action="/friends"
            className="flex flex-wrap items-end gap-3"
            role="search"
          >
            <TextField
              className="min-w-56 flex-1"
              defaultValue={email}
              name="email"
            >
              <Label>Their email address</Label>
              <Input placeholder="cook@example.com" type="email" />
            </TextField>
            <ActionButton tier="primary" type="submit">
              Search
            </ActionButton>
          </form>

          {/* The same answer whether nobody uses that address or they would rather
              not be found, so that this cannot be used to test who has an account. */}
          {email && matches.length === 0 ? (
            <Typography className="mt-3" color="muted" type="body-sm">
              No one to add at that address. Check the spelling, or ask them for
              the address they signed up with.
            </Typography>
          ) : null}

          {matches.length > 0 ? (
            <ul className="mt-2 flex list-none flex-col p-0">
              {matches.map((person) => (
                <PersonRow
                  actions={
                    friendIds.has(person.id) ? (
                      <Typography color="muted" type="body-sm">
                        Already connected
                      </Typography>
                    ) : sentIds.has(person.id) ? (
                      <ActionLink href="/friends/invites" tier="quiet">
                        Request sent
                      </ActionLink>
                    ) : receivedIds.has(person.id) ? (
                      <ActionLink href="/friends/invites" tier="neutral">
                        Answer their request
                      </ActionLink>
                    ) : (
                      <PersonAction
                        action={sendFriendRequest}
                        label="Add friend"
                        name="personId"
                        value={person.id}
                      />
                    )
                  }
                  avatarUrl={person.avatarUrl}
                  context="Search result"
                  key={person.id}
                  name={person.displayName}
                />
              ))}
            </ul>
          ) : null}
        </Card.Content>
      </ContentCard>

      <ContentCard>
        <Card.Header>
          <PanelTitle>Your friends</PanelTitle>
        </Card.Header>

        <Card.Content>
          {friends.length === 0 ? (
            <EmptyState
              bare
              description="Add someone by their email address above. Once you are connected you can share recipes and shop from the same list."
              icon={<UsersRound aria-hidden="true" className="size-6" />}
              title="No friends yet"
            />
          ) : (
            <PeopleList
              people={friends.map((person) => ({
                actions: [
                  {
                    action: removeFriend,
                    label: "Remove",
                    name: "personId",
                    value: person.id,
                    variant: "ghost" as const,
                  },
                ],
                avatarUrl: person.avatarUrl,
                context: "Can receive shared weeks and recipes",
                id: person.id,
                name: person.displayName,
              }))}
            />
          )}
        </Card.Content>
      </ContentCard>
    </>
  );
}
