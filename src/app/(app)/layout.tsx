import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppHeader } from "@/components/ui/app-header";
import { AccountMenu } from "@/features/auth/components/account-menu";
import { getCurrentUser } from "@/features/auth/current-user";

const navigationItems = [
  { href: "/", label: "Today" },
  { href: "/recipes", label: "Recipes" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  // The proxy already redirects anonymous requests; this covers a session that
  // expires between the proxy check and rendering.
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <AppHeader
          actions={
            <AccountMenu
              displayName={user.displayName}
              initials={user.initials}
            />
          }
          homeHref="/"
          navigationItems={navigationItems}
          navigationLabel="Main navigation"
        />
        {children}
      </div>
    </div>
  );
}
