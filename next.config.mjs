// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Konquered Kocktails: /, /book, /portfolio, /reviews, /merch, plus the
// /api/book/* proxies and /api/reviews. All styling inline, all video on Mux,
// so there's nothing here for image remote patterns or rewrites.

/** @type {import('next').NextConfig} */
const nextConfig = {
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
