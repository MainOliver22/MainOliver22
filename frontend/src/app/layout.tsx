import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investment Platform",
  description: "A modern investment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
