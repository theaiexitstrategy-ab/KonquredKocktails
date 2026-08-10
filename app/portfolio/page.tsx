// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Konquered Kocktails event log — konqueredkocktails.com/portfolio.
//
// A running repository of every event Stephen has composed, newest first,
// filterable by type and year. Portal-driven: he logs an entry (video,
// description, date, venue, type) from the portal Portfolio tab and it
// appears here with no redeploy. See PortfolioClient.tsx for the contract
// and the seed fallback.

import PortfolioClient from './PortfolioClient';

export const metadata = {
  title: 'Event Library — Stephen Simmons | Konquered Kocktails',
  description:
    'The searchable record of every Konquered Kocktails event. Stephen Simmons composes a drink experience from the elements already in the room — this is every one of them, logged.',
  openGraph: {
    title: 'Event Library — Stephen Simmons | Konquered Kocktails',
    description:
      'Not a bar for hire. A curated drink experience composed from the elements in the room — and the complete record of every event.',
    url: 'https://konqueredkocktails.com/portfolio',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Event Log — Stephen Simmons | Konquered Kocktails',
    description: 'The complete record of Konquered Kocktails events.',
  },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
