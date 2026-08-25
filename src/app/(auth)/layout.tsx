import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <span className="font-brand text-3xl leading-normal">iMeal</span>
      {children}
    </main>
  );
}
