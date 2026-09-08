import type { Metadata } from "next";

import { Card } from "@heroui/react";

import { MailCheck } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ContentCard } from "@/components/ui/content-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PanelTitle } from "@/components/ui/panel-title";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { FriendsTabs } from "@/features/friends/components/friends-tabs";
import { PeopleList } from "@/features/friends/components/people-list";
import {
  acceptFriendRequest,
  declineFriendRequest,
  withdrawFriendRequest,
} from "@/features/friends/friend.actions";
import {
  listIncomingRequests,
  listOutgoingRequests,
} from "@/features/friends/friend.queries";

export const metadata: Metadata = { title: "Invitations" };

export default async function InvitesPage() {
  const [incoming, outgoing] = await Promise.all([
    listIncomingRequests(),
    listOutgoingRequests(),
  ]);

  return (
    <PageShell gap="snug" width="narrow">
      <PageHeader
        description="Requests waiting on you, and the ones you are waiting on."
        title="Invitations"
      />

      <FriendsTabs current="invites" waiting={incoming.length} />

      {/* Both panels are always here, empty or not: a page that grows a section the
          moment someone writes to you rearranges itself while you are reading it. */}
      <ContentCard>
        <Card.Header className="gap-1">
          <Eyebrow>Waiting on you</Eyebrow>
          <PanelTitle>Received</PanelTitle>
        </Card.Header>

        <Card.Content>
          {incoming.length === 0 ? (
            <EmptyState
              bare
              description="When someone asks to cook with you, it will appear here."
              icon={<MailCheck aria-hidden="true" className="size-6" />}
              title="Nothing to answer"
            />
          ) : (
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
          )}
        </Card.Content>
      </ContentCard>

      <ContentCard>
        <Card.Header className="gap-1">
          <Eyebrow>Waiting on a reply</Eyebrow>
          <PanelTitle>Sent</PanelTitle>
        </Card.Header>

        <Card.Content>
          {outgoing.length === 0 ? (
            <EmptyState
              bare
              description="Add someone by their email address from the Friends tab."
              icon={<MailCheck aria-hidden="true" className="size-6" />}
              title="Nothing sent"
            />
          ) : (
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
          )}
        </Card.Content>
      </ContentCard>
    </PageShell>
  );
}
