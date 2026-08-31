"use client";

import { TriangleAlert } from "lucide-react";

import { ActionLink } from "@/components/ui/action";
import { ActionButton } from "@/components/ui/action";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Anything inside the app shell that throws lands here. Shopping keeps its own
 * boundary because it can explain what a failed list change means.
 */
export default function AppError({ retry }: { retry: () => void }) {
  return (
    <main className="flex flex-1 items-center py-12">
      <EmptyState
        actions={
          <>
            <ActionButton onPress={retry} tier="primary">
              Try again
            </ActionButton>
            <ActionLink href="/" tier="neutral">
              Return to Today
            </ActionLink>
          </>
        }
        description="Something went wrong on our side. Nothing you had saved is affected."
        icon={<TriangleAlert className="size-6" />}
        title="That did not load"
      />
    </main>
  );
}
