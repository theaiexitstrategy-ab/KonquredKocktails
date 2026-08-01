// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Guest review capture — konqueredkocktails.com/reviews.
//
// A rating and a few sentences is a complete submission; everything else is
// optional and labelled as such. Reviews land unpublished and appear in the
// social-proof strip only after Stephen approves them — enforced in the API
// route and again by the RLS policy on public.reviews.

import ReviewsClient from './ReviewsClient';

export const metadata = {
  title: 'Share Your Story — Konquered Kocktails',
  description:
    'Tell Stephen Simmons what stayed with you. Guest stories from Konquered Kocktails experiences across Greater St. Louis.',
  openGraph: {
    title: 'Share Your Story — Konquered Kocktails',
    description:
      'Intention is the experience. Tell us what made the night unforgettable.',
    url: 'https://konqueredkocktails.com/reviews',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Share Your Story — Konquered Kocktails',
    description: 'Tell us what made the night unforgettable.',
  },
};

export default function ReviewsPage() {
  return <ReviewsClient />;
}
