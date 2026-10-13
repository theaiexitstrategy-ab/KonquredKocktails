// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Konquered Kocktails: /, /book, /portfolio, /reviews, /merch, plus the
// /api/book/* proxies and /api/reviews. All styling inline, all video on Mux;
// the one remote image host is the event-flyer bucket below.

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Event flyers (Upcoming Experiences) — Stephen uploads them in the
    // portal to the public event-photos bucket. Scoped to that one bucket.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bnkoqybkmwtrlorhowyv.supabase.co',
        pathname: '/storage/v1/object/public/event-photos/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        // Both konqueredkocktails.com and www.konqueredkocktails.com are
        // attached to the Vercel project, and without this both answered 200
        // — the whole site duplicated at two addresses. Every page already
        // declares the apex as its og:url, so the apex is canonical and www
        // is the alias. 308 (permanent) so search engines consolidate and
        // the method is preserved.
        source: '/:path*',
        has: [{ type: 'host', value: 'www.konqueredkocktails.com' }],
        destination: 'https://konqueredkocktails.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
