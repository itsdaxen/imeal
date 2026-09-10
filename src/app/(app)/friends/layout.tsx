import { Suspense } from "react";

import { Skeleton } from "@heroui/react";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { FriendsContentSkeleton } from "@/features/friends/components/friends-content-skeleton";
import {
  CountBadge,
  FriendsTabs,
} from "@/features/friends/components/friends-tabs";
import { listIncomingRequests } from "@/features/friends/friend.queries";

/**
 * The heading and the tabs belong to the section, not to either page inside it.
 *
 * A layout is not torn down when you move between its children, so switching tabs
 * swaps the panels underneath and leaves everything above untouched — no skeleton,
 * no heading redrawing itself, and the tab you pressed stays pressed.
 */
export default function FriendsLayout({ children }: LayoutProps<"/friends">) {
  return (
    <PageShell gap="snug" width="narrow">
      <PageHeader title="Friends" />
      <FriendsTabs
        waiting={
          <Suspense fallback={<Skeleton className="size-5 rounded-full" />}>
            <WaitingCount />
          </Suspense>
        }
      >
        <Suspense fallback={<FriendsContentSkeleton />}>{children}</Suspense>
      </FriendsTabs>
    </PageShell>
  );
}

async function WaitingCount() {
  const incoming = await listIncomingRequests();

  return incoming.length > 0 ? <CountBadge count={incoming.length} /> : null;
}
