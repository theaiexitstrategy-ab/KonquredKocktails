// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Konquered Kocktails portfolio — konqueredkocktails.com/portfolio.
//
// A résumé of Stephen's work: credentials, then his reel. Portal-driven the
// same way /merch is — Stephen adds and removes videos from the portal
// Portfolio tab, capped at 5, with no redeploy. See PortfolioClient.tsx for
// the contract and the seed-reel fallback.

import PortfolioClient from './PortfolioClient';

export const metadata = {
  title: 'Portfolio — Stephen Simmons | Konquered Kocktails',
  description:
    'The work behind Konquered Kocktails: live mixology, kraft kocktails, and curated Art + Kreativity from Stephen Simmons — Gentleman Jack Culture Shakers 2021, serving Greater St. Louis.',
  openGraph: {
    title: 'Portfolio — Stephen Simmons | Konquered Kocktails',
    description:
      'Live mixology, kraft kocktails, and curated Art + Kreativity. Selected work from Stephen Simmons.',
    url: 'https://konqueredkocktails.com/portfolio',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio — Stephen Simmons | Konquered Kocktails',
    description: 'Live mixology, kraft kocktails, and curated Art + Kreativity.',
  },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
