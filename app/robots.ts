// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Served at /robots.txt. Everything public is indexable; the API routes are
// not pages and have nothing to crawl. The compliance pages are deliberately
// left indexable — carriers and the Campaign Registry expect a policy URL to
// be publicly reachable and findable.

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }],
    sitemap: 'https://konqueredkocktails.com/sitemap.xml',
    host: 'https://konqueredkocktails.com',
  };
}
