import type { Metadata } from "next";

import { Dancing_Script, Geist } from "next/font/google";

import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--imeal-sans-font" });

// Only the wordmark uses it, so it loads one weight and nothing else.
const brand = Dancing_Script({
  subsets: ["latin"],
  variable: "--imeal-brand-font",
  weight: "700",
});

export const metadata: Metadata = {
  title: {
    default: "iMeal",
    template: "%s | iMeal",
  },
  description:
    "Plan trusted recipes, build a realistic week, and shop from one useful list.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={`light ${sans.variable} ${brand.variable}`}
      data-theme="light"
      lang="en"
    >
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
