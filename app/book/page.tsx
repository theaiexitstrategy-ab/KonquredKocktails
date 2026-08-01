// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// The official booking calendar — konqueredkocktails.com/book.
//
// Availability comes from the portal (weekly rules − blackout blocks −
// existing bookings), so a slot shown here is genuinely open. This is the
// only booking flow on the site; the homepage's /#book section is a pitch
// that links here. See BookClient.tsx for the wiring.

import BookClient from './BookClient';

export const metadata = {
  title: 'Reserve a Date — Konquered Kocktails',
  description:
    'Check Stephen Simmons’ live calendar and reserve a date for a Konquered Kocktails experience. A $200 deposit holds your date and applies in full to your final balance.',
  openGraph: {
    title: 'Reserve a Date — Konquered Kocktails',
    description:
      'Check the live calendar and reserve a date for a curated Konquered Kocktails experience.',
    url: 'https://konqueredkocktails.com/book',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reserve a Date — Konquered Kocktails',
    description: 'Check the live calendar and reserve your date.',
  },
};

export default function BookPage() {
  return <BookClient />;
}
