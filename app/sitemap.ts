// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Served at /sitemap.xml by Next's metadata route. Every public page,
// including the compliance set — A2P 10DLC review wants those indexable and
// reachable without an account.

import type { MetadataRoute } from 'next';

const BASE = 'https://konqueredkocktails.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: [string, number, MetadataRoute.Sitemap[number]['changeFrequency']][] = [
    ['', 1.0, 'weekly'],
    ['/experiences', 0.9, 'monthly'],
    ['/book', 0.9, 'weekly'],
    ['/portfolio', 0.8, 'weekly'],
    ['/reviews', 0.7, 'weekly'],
    ['/merch', 0.7, 'weekly'],
    ['/sms-consent', 0.5, 'yearly'],
    ['/sms-compliance', 0.4, 'yearly'],
    ['/privacy', 0.4, 'yearly'],
    ['/terms', 0.4, 'yearly'],
  ];

  return pages.map(([path, priority, changeFrequency]) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
