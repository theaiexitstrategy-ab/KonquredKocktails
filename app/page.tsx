// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Konquered Kocktails — customer-facing booking site. This is the homepage.
//
// The live product goElev8 delivers under the Konquered Balance contract:
// the branded booking site at konqueredkocktails.com. It captures leads,
// books events, and collects the $200 deposit through
// /api/checkout/kbsetup (Connect destination charge to Konquered Balance's
// account).
//
// Served at konqueredkocktails.com/ — migrated here from goelev8.ai/kk.
// Self-contained, no auth. Carries the Konquered Kocktails palette from
// CLAUDE.md (Warm Black #151310 / Deep Emerald #123D35 / Royal Gold #C39A45)
// with Cormorant Garamond display over Outfit body. All photography is
// Konquered Kocktails' own, pulled from
// konqueredbalance.com/konqueredkocktails and self-hosted under /images/kk.

import KkClient from './KkClient';

export const metadata = {
  title: 'Konquered Kocktails — Kraft Kocktail Experiences · Art + Kreativity',
  description:
    'Handcrafted themed Kocktails, custom mixology experiences, spirit tastings, and curated Art + Kreativity for weddings, corporate events, and private parties across Greater St. Louis. Book your date with a $200 deposit.',
  openGraph: {
    title: 'Konquered Kocktails — Kraft Kocktail Experiences · Art + Kreativity',
    description:
      'Handcrafted themed Kocktails, custom mixology experiences, and curated Art + Kreativity. Book your event date online.',
    url: 'https://konqueredkocktails.com',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Konquered Kocktails — Kraft Kocktail Experiences · Art + Kreativity',
    description:
      'Handcrafted themed Kocktails, custom mixology, and curated Art + Kreativity. Book online.',
  },
};

export default function KkPage() {
  return <KkClient />;
}
