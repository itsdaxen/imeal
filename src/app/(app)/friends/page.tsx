import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Card, cn, Input, Label, TextField, Typography } from "@heroui/react";

import { UsersRound } from "lucide-react";

import { ActionButton } from "@/components/ui/action";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentCard } from "@/components/ui/content-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PageGrid, span } from "@/components/ui/page-grid";
import { PanelTitle } from "@/components/ui/panel-title";
import { PersonAction } from "@/features/friends/components/person-action";
import { PeopleList } from "@/features/friends/components/people-list";
import { PersonRow } from "@/features/friends/components/person-row";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
  withdrawFriendRequest,
} from "@/features/friends/friend.actions";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  searchPeople,
} from "@/features/friends/friend.queries";

export const metadata: Metadata = { title: "Friends" };

/** Each group of people is a panel, so a quiet week is not four floating headings. */
function Panel({
  children,
  compactOnMobile = false,
  eyebrow,
  title,
  width = span.full,
}: {
  children: ReactNode;
  compactOnMobile?: boolean;
  eyebrow: string;
  title: string;
  width?: string;
}) {
  return (
    <ContentCard className={cn(width, compactOnMobile && "p-4 sm:p-6")}>
      <Card.Header className="gap-1">
        <Eyebrow>{eyebrow}</Eyebrow>
        <PanelTitle>{title}</PanelTitle>
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </ContentCard>
  );
}

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [friends, incoming, outgoing, matches] = await Promise.all([
    listFriends(),
    listIncomingRequests(),
    listOutgoingRequests(),
    searchPeople(search ?? ""),
  ]);

  const knownIds = new Set([
    ...friends.map((person) => person.id),
    ...outgoing.map((request) => request.person.id),
  ]);
  const pending = incoming.length > 0 || outgoing.length > 0;

  return (
    <main className="flex flex-col gap-6 pt-10 sm:pt-14">
      <header className="flex flex-col gap-1">
        <Typography type="h1" weight="semibold">
          Friends
        </Typography>
        <Typography color="muted" type="body">
          Share recipes with the people you cook with.
        </Typography>
      </header>

      <PageGrid>
        <Panel
          compactOnMobile
          eyebrow="Search"
          title="Find someone"
          width={pending ? span.wide : span.full}
        >
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
            <ActionButton tier="primary" type="submit">
              Search
            </ActionButton>
          </form>

          {search && matches.length === 0 ? (
            <Typography className="mt-3" color="muted" type="body-sm">
              Nobody discoverable matches that name. They may have turned off
              friend discovery.
            </Typography>
          ) : null}

          {matches.length > 0 ? (
            <ul className="mt-2 flex list-none flex-col p-0">
              {matches.map((person) => (
                <PersonRow
                  actions={
                    knownIds.has(person.id) ? (
                      <Typography color="muted" type="body-sm">
                        Already connected
                      </Typography>
                    ) : (
                      <PersonAction
                        action={sendFriendRequest}
                        label="Add friend"
                        name="personId"
                        value={person.id}
                      />
                    )
                  }
                  context="Search result"
                  key={person.id}
                  name={person.displayName}
                />
              ))}
            </ul>
          ) : null}
        </Panel>

        {incoming.length > 0 ? (
          <Panel
            eyebrow="Waiting on you"
            title="Requests for you"
            width={span.narrow}
          >
            <PeopleList
              people={incoming.map((request) => ({
                actions: [
                  {
                    action: acceptFriendRequest,
                    label: "Accept",
                    name: "requestId",
                    value: request.id,
                  },
                  {
                    action: declineFriendRequest,
                    label: "Decline",
                    name: "requestId",
                    value: request.id,
                    variant: "ghost" as const,
                  },
                ],
                context: "Sent you a request",
                id: request.id,
                name: request.person.displayName,
              }))}
            />
          </Panel>
        ) : null}

        {outgoing.length > 0 ? (
          <Panel eyebrow="Sent" title="Waiting on a reply" width={span.narrow}>
            <PeopleList
              people={outgoing.map((request) => ({
                actions: [
                  {
                    action: withdrawFriendRequest,
                    label: "Withdraw",
                    name: "requestId",
                    value: request.id,
                    variant: "ghost" as const,
                  },
                ],
                context: "Request sent",
                id: request.id,
                name: request.person.displayName,
              }))}
            />
          </Panel>
        ) : null}

        <Panel
          eyebrow="Connected"
          title="Your friends"
          width={pending ? span.wide : span.full}
        >
          {friends.length === 0 ? (
            <EmptyState
              bare
              description="Search for someone by name above. Once you are connected you can share recipes and shop from the same list."
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
                context: "Can receive shared weeks and recipes",
                id: person.id,
                name: person.displayName,
              }))}
            />
          )}
        </Panel>
      </PageGrid>
    </main>
  );
}
