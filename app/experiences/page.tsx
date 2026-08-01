// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// The Experience Collection — konqueredkocktails.com/experiences.
//
// Lead capture first, then the Konquered Experience Journey, then the seven
// offerings and their pricing. The homepage now teases this page rather than
// duplicating it, so the collection lives in exactly one place.

import ExperiencesClient from './ExperiencesClient';

export const metadata = {
  title: 'The Experience Collection — Konquered Kocktails',
  description:
    'Seven ways into the work, from a single Kustom expression to a full on-site experience. Krafted Kocktails, guided tastings, and culinary artistry composed around your people and your atmosphere.',
  openGraph: {
    title: 'The Experience Collection — Konquered Kocktails',
    description:
      'Seven ways into the work. Intention is the experience.',
    url: 'https://konqueredkocktails.com/experiences',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Experience Collection — Konquered Kocktails',
    description: 'Seven ways into the work. Intention is the experience.',
  },
};

export default function ExperiencesPage() {
  return <ExperiencesClient />;
}
