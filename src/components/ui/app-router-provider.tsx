"use client";

import type { ReactNode } from "react";

import { RouterProvider } from "@heroui/react";
import { useRouter } from "next/navigation";

/** Connects React Aria links to Next's client-side router. */
export function AppRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={(href) => router.push(String(href))}>
      {children}
    </RouterProvider>
  );
}
