// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Konquered Kocktails storefront — konqueredkocktails.com/merch.
//
// Same portal-driven format as theflexfacility.com/merch,
// islaystudiosllc.com/merch, and willpowerfitnessfactory.com/merch: the
// GoElev8 portal's Merch tab is the catalog, and this page renders whatever
// it returns. See MerchClient.tsx for the wiring.
//
// Deliberately not statically pre-rendered with a product list — the shelf is
// fetched client-side on every load so a change Stephen makes in the portal
// shows up immediately, with no rebuild and no stale ISR window.

import MerchClient from './MerchClient';

export const metadata = {
  title: 'Shop — Konquered Kocktails',
  description:
    'Barware, glassware, and Konquered Kocktails gear from the St. Charles kraft kocktail studio. The same craft that shows up behind the bar.',
  openGraph: {
    title: 'Shop — Konquered Kocktails',
    description:
      'Barware, glassware, and Konquered Kocktails gear. The same craft that shows up behind the bar.',
    url: 'https://konqueredkocktails.com/merch',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop — Konquered Kocktails',
    description: 'Barware, glassware, and Konquered Kocktails gear.',
  },
};

export default function MerchPage() {
  return <MerchClient />;
}
