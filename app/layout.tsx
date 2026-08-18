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
//
//   3. Load Google Analytics for every route.
//
// GA goes through next/script rather than raw <script> tags. In the App
// Router a bare <script> in <head> is not guaranteed to execute the way it
// does in plain HTML, and next/script also keeps the tag out of the critical
// path — afterInteractive fires once the page is usable, so analytics never
// delays first paint. Putting it in the root layout means it covers every
// page including the compliance set, with no per-page wiring.

import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

/** GA4 measurement ID. */
const GA_ID = 'G-NTL8CFVYY6';

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
      <body style={{ margin: 0, padding: 0, background: '#151310' }}>
        {children}

        {/* Google Analytics (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
      </body>
    </html>
  );
}
