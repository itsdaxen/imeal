"use client";

import type { ReactNode } from "react";

import { RouterProvider, Toast } from "@heroui/react";
import { useRouter } from "next/navigation";

/**
 * Connects React Aria links to Next's client-side router, and gives the app somewhere
 * to put a passing message.
 *
 * The toast region is mounted once, here, because a toast raised anywhere has to be
 * drawn above everything — a form that raised its own would be trapped inside
 * whatever card it happens to sit in.
 */
export function AppRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={(href) => router.push(String(href))}>
      {children}
      {/* Beside the app rather than around it: wrapping the tree would put every
          route behind the provider's own boundary, setting them all streaming and
          taking the 404 off pages that refuse to exist. */}
      <Toast.Provider placement="bottom end" />
    </RouterProvider>
  );
}
