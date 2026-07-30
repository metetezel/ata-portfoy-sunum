import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// The Ata Portföy logo's wordmark is a geometric rounded sans — Poppins is the
// closest widely-available match, used holistically across the whole page
// (headings, body, data) instead of mixing typefaces.
const poppins = Poppins({
  subsets: ["latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Ata Portföy Sunum",
  description: "Haftalık yatırımcı sunumu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
