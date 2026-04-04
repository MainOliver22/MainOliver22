import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "qfx-finance.com",
  description: "CFD Trading on Stocks, Gold, Oil, Indices with ultra-fast execution",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
