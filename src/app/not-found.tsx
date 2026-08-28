import { MapPinOff } from "lucide-react";
import { Link } from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { BackAction } from "@/components/ui/back-action";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <Link
        aria-label="iMeal home"
        className="self-start font-brand text-3xl text-foreground no-underline"
        href="/"
      >
        iMeal
      </Link>
      <div className="flex flex-1 items-center py-12">
        <EmptyState
          actions={
            <>
              <ActionLink href="/" tier="primary">
                Return to Today
              </ActionLink>
              <BackAction />
            </>
          }
          description="The page may have moved, been deleted, or no longer be available to you."
          icon={<MapPinOff className="size-6" />}
          title="We couldn't find that page"
        />
      </div>
    </main>
  );
}
