import { notFound } from "next/navigation";

import { isCurrentUserAdmin } from "@/features/catalog/catalog.queries";

/**
 * The gate sits in the layout so that it runs before anything is sent.
 *
 * A gate in the page cannot decide the status code once the segment has a
 * `loading.tsx`: the skeleton is flushed straight away, so by the time the page
 * refuses, the reply is already a 200 titled "Moderation". A layout is part of that
 * first flush and is awaited before it, so refusing here is a real 404 and the route
 * does not exist for anyone but a moderator.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isCurrentUserAdmin())) {
    notFound();
  }

  return children;
}
