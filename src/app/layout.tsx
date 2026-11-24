import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Schibsted_Grotesk } from "next/font/google";
import { AppearanceProvider } from "@/components/appearance-provider";
import { brand } from "@/config/brand";
import { APPEARANCE_SCRIPT } from "@/lib/appearance";
import "./globals.css";

const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });
// Only downloaded when a student picks "Easy to read" in settings.
const readable = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-readable",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: `${brand.name} · ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.description,
};

export const viewport: Viewport = {
  themeColor: "#0d1322",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The appearance script sets data-* attributes before React hydrates, so they differ
    // from the server HTML on purpose.
    <html lang="en-GB" className={`${sans.variable} ${readable.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-night text-ink">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-paper px-4 py-2 font-medium text-paper-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
