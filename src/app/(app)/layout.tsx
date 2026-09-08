import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppFooter } from "@/components/ui/app-footer";
import { AppHeader } from "@/components/ui/app-header";
import { StickyHeader } from "@/components/ui/sticky-header";
import { AccountMenu } from "@/features/auth/components/account-menu";
import { getCurrentUser } from "@/features/auth/current-user";
import { isCurrentUserAdmin } from "@/features/catalog/catalog.queries";
import { listIncomingRequests } from "@/features/friends/friend.queries";

const navigationItems = [
  { href: "/", label: "Today" },
  { href: "/planner", label: "Planner" },
  { href: "/shopping", label: "Shopping" },
  { href: "/recipes", label: "Recipes" },
  { href: "/catalog", label: "Catalog" },
  { href: "/friends", label: "Friends" },
] as const;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, isAdmin, incoming] = await Promise.all([
    getCurrentUser(),
    isCurrentUserAdmin(),
    listIncomingRequests(),
  ]);

  // The proxy already redirects anonymous requests; this covers a session that
  // expires between the proxy check and rendering.
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <StickyHeader>
        <AppHeader
          actions={
            <AccountMenu
              avatarUrl={user.avatarUrl}
              displayName={user.displayName}
              initials={user.initials}
            />
          }
          homeHref="/"
          navigationItems={[
            // Someone waiting on you is worth seeing from any page, not only the one
            // you would have to think to visit.
            ...navigationItems.map((item) =>
              item.href === "/friends"
                ? { ...item, badge: incoming.length }
                : item,
            ),
            ...(isAdmin ? [{ href: "/admin", label: "Moderation" }] : []),
          ]}
          navigationLabel="Main navigation"
        />
      </StickyHeader>

      <div className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
        {children}
        <AppFooter />
      </div>
    </div>
  );
}
