// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Root layout for konqueredkocktails.com. The page itself (app/page.tsx →
// app/KkClient.tsx) is fully self-styled with inline styles, so this file has
// exactly two jobs:
//
//   1. Load the two brand typefaces the page hard-codes by name:
//      - Outfit            — body, labels, buttons, and the wordmark
//                            (matches the Konquered Balance logo)
//      - Cormorant Garamond — editorial display headlines
//      Neither has a system fallback that looks right, so they load from
//      Google Fonts with preconnects and display=swap.
//
//   2. Give <body> the Warm Black base (#151310, CLAUDE.md palette) with no
//      default margin, so the page sits flush and overscroll never flashes
//      white.

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Konquered Kocktails — Kraft Kocktail Experiences · Art + Kreativity',
    template: '%s | Konquered Kocktails',
  },
  description:
    'Handcrafted themed Kocktails, custom mixology experiences, and curated Art + Kreativity for weddings, corporate events, and private parties across Greater St. Louis.',
  metadataBase: new URL('https://konqueredkocktails.com'),
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#151310',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* no-page-custom-font warns that a font added outside
            pages/_document.js loads for only one page. That's a Pages Router
            rule: this IS the App Router root layout, so the stylesheet
            applies to every route — which is what the rule is asking for. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#151310' }}>{children}</body>
    </html>
  );
}
