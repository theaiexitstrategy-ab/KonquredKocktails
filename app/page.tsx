// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Konquered Kocktails — the homepage.
//
// POSITIONING, and the reason most of this copy reads the way it does:
// this is NOT a bartender-for-hire service. Stephen Simmons is an artist who
// composes a drink experience out of the elements already in the room — the
// people, the occasion, the light, the spirits on hand. Copy across the site
// should read as commissioning an artist, never as booking a bar. If you're
// editing this page, keep that line.
//
// The homepage does not take bookings. Its /#book section is a pitch that
// links to /book, which is the one booking flow and runs on real
// portal-computed availability. The old inline funnel here used a
// client-side next-6-days calendar with seven fixed times and could
// double-book; it's gone.
//
// Served at konqueredkocktails.com/ — migrated here from goelev8.ai/kk.
// Self-contained, no auth. Carries the Konquered Kocktails palette from
// CLAUDE.md (Warm Black #151310 / Deep Emerald #123D35 / Royal Gold #C39A45)
// with Cormorant Garamond display over Outfit body. All photography is
// Konquered Kocktails' own, pulled from
// konqueredbalance.com/konqueredkocktails and self-hosted under /images/kk.

import KkClient from './KkClient';

export const metadata = {
  title: 'Konquered Kocktails — An Art Gallery in a Glass',
  description:
    'Not a bar service. Stephen Simmons composes a drink experience out of the elements already in your room — live mixology, guided tastings, and curated Art + Kreativity for weddings, corporate events, and private parties across Greater St. Louis.',
  openGraph: {
    title: 'Konquered Kocktails — An Art Gallery in a Glass',
    description:
      'Not a bar service. An artist composes a drink experience out of the elements already in your room. Reserve a date.',
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
