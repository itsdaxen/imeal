import type { ReactNode } from "react";
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-default px-4 py-5 sm:px-6 sm:py-8">
      {children}
    </div>
  );
}
