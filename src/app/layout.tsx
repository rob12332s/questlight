import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { brand } from "@/config/brand";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: brand.description,
};

export const viewport: Viewport = {
  themeColor: "#080c1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-canvas text-ink">{children}</body>
    </html>
  );
}
