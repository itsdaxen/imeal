import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { FriendsTabs } from "@/features/friends/components/friends-tabs";
import { listIncomingRequests } from "@/features/friends/friend.queries";

/**
 * The heading and the tabs belong to the section, not to either page inside it.
 *
 * A layout is not torn down when you move between its children, so switching tabs
 * swaps the panels underneath and leaves everything above untouched — no skeleton,
 * no heading redrawing itself, and the tab you pressed stays pressed.
 */
export default async function FriendsLayout({
  children,
}: LayoutProps<"/friends">) {
  const incoming = await listIncomingRequests();

  return (
    <PageShell gap="snug" width="narrow">
      <PageHeader title="Friends" />
      <FriendsTabs waiting={incoming.length} />
      {children}
    </PageShell>
  );
}
