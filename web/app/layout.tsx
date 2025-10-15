import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scout - Versatile Chrome Extension",
  description:
    "A versatile Chrome extension with command palette, controller testing, and multi-provider search capabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
