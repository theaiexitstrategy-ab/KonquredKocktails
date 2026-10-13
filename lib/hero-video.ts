// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Which Mux video plays in the homepage hero. Stephen picks it in the portal
// (Portfolio tab → "Set as homepage hero"), so swapping it is a portal click,
// not a redeploy.
//
//   read → GET {PORTAL_URL}/api/external/hero-video?slug={PORTAL_SLUG}
//          200 { hero: { playback_id, title, aspect_ratio, updated_at } | null }
//
// Public endpoint, same as /api/external/portfolio — a playback id is already
// public the moment it plays on the page. Fetched server-side so the hero
// renders with the right video on first paint, no swap after hydration.
//
// Any failure — portal down, slow, 404 tenant_not_found, no hero chosen, a
// malformed id — falls back to DEFAULT_HERO_PLAYBACK_ID. The hero must never
// render an empty phone frame.

import { PORTAL_URL, PORTAL_SLUG } from './portal';

/** The silent loop the hero shipped with. Also the fallback. */
export const DEFAULT_HERO_PLAYBACK_ID = 'FSsAfj00KwDZSPPaApJjMHqx5msnrneNULZFEdDov01g8';

/** Fallback freshness, in seconds. Normally the portal pings /api/revalidate
 *  with this tag the moment Stephen changes the hero, so this only matters
 *  if that ping fails. */
export const HERO_REVALIDATE_SECONDS = 60;

/** Cache tag on the hero fetch; app/api/revalidate drops it on demand. */
export const HERO_VIDEO_TAG = 'hero-video';

/** Mux playback ids are alphanumeric. Anything else is not rendered. */
const PLAYBACK_ID = /^[A-Za-z0-9]{10,80}$/;

export async function getHeroPlaybackId(): Promise<string> {
  try {
    const url = new URL('/api/external/hero-video', PORTAL_URL);
    url.searchParams.set('slug', PORTAL_SLUG);
    const res = await fetch(url, {
      next: { revalidate: HERO_REVALIDATE_SECONDS, tags: [HERO_VIDEO_TAG] },
      // Don't hold the homepage render hostage to the portal.
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return DEFAULT_HERO_PLAYBACK_ID;
    const data = (await res.json()) as { hero?: { playback_id?: unknown } | null };
    const id = data?.hero?.playback_id;
    return typeof id === 'string' && PLAYBACK_ID.test(id) ? id : DEFAULT_HERO_PLAYBACK_ID;
  } catch {
    return DEFAULT_HERO_PLAYBACK_ID;
  }
}
